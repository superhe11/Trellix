import { BoardRole, CardStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";

const cardInclude = {
  list: {
    select: {
      id: true,
      title: true,
      boardId: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  assignments: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          managerId: true,
        },
      },
    },
  },
} as const;

export async function createCard(
  user: Express.UserPayload,
  listId: string,
  payload: {
    title: string;
    description?: string;
    position?: number;
    assigneeIds?: string[];
    dueDate?: string;
  }
) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: {
      id: true,
      boardId: true,
      board: {
        select: {
          ownerId: true,
          members: {
            where: { userId: user.userId },
            select: {
              userId: true,
              role: true,
              canManageCards: true,
            },
          },
        },
      },
    },
  });

  if (!list) {
    throw new HttpError(404, "Список не найден");
  }

  ensureCardCreationRights(user, list);

  const assigneeIds = Array.from(new Set(payload.assigneeIds ?? []));
  await ensureAssigneesAllowed(user, list.boardId, assigneeIds);

  const dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
  const position = await resolvePositionForCard(listId, payload.position);

  const card = await prisma.card.create({
    data: {
      title: payload.title,
      description: payload.description,
      position,
      status: CardStatus.TODO,
      listId,
      createdById: user.userId,
      dueDate,
      assignments: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
    include: cardInclude,
  });

  return card;
}

export async function updateCard(
  user: Express.UserPayload,
  cardId: string,
  payload: {
    title?: string;
    description?: string | null;
    status?: CardStatus;
    position?: number;
    listId?: string;
    assigneeIds?: string[];
    dueDate?: string | null;
    archived?: boolean;
  }
) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: {
        select: {
          id: true,
          boardId: true,
          board: {
            select: {
              ownerId: true,
              members: {
                select: {
                  userId: true,
                  role: true,
                  canManageCards: true,
                },
              },
            },
          },
        },
      },
      createdById: true,
      assignments: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              managerId: true,
            },
          },
        },
      },
    },
  });

  if (!card) {
    throw new HttpError(404, "Карточка не найдена");
  }

  ensureCardManageRights(user, card.list.board, card);

  const assigneeIds = payload.assigneeIds ? Array.from(new Set(payload.assigneeIds)) : undefined;
  if (assigneeIds) {
    await ensureAssigneesAllowed(user, card.list.boardId, assigneeIds);
  }

  return prisma.$transaction(async (tx) => {
    let targetListId = card.list.id;

    if (payload.listId && payload.listId !== card.list.id) {
      const targetList = await tx.list.findUnique({
        where: { id: payload.listId },
        select: { id: true, boardId: true },
      });
      if (!targetList) {
        throw new HttpError(404, "Целевой список не найден");
      }
      if (targetList.boardId !== card.list.boardId) {
        throw new HttpError(400, "Карточку нельзя перенести на другую доску");
      }
      targetListId = targetList.id;
    }

    const position = await resolvePositionForCard(targetListId, payload.position, tx);
    const dueDate =
      payload.dueDate === undefined ? undefined : payload.dueDate ? new Date(payload.dueDate) : null;

    const updated = await (tx ?? prisma).card.update({
      where: { id: cardId },
      data: {
        title: payload.title,
        description: payload.description ?? undefined,
        status: payload.status,
        position,
        listId: targetListId,
        dueDate,
        archived: payload.archived,
      },
    });

    if (assigneeIds) {
      const toDelete = card.assignments
        .filter((assignment) => !assigneeIds.includes(assignment.userId))
        .map((assignment) => assignment.userId);

      if (toDelete.length) {
        await (tx ?? prisma).cardAssignment.deleteMany({
          where: {
            cardId,
            userId: { in: toDelete },
          },
        });
      }

      const existing = new Set(card.assignments.map((assignment) => assignment.userId));
      const toCreate = assigneeIds.filter((id) => !existing.has(id));

      if (toCreate.length) {
        await (tx ?? prisma).cardAssignment.createMany({
          data: toCreate.map((id) => ({ cardId, userId: id })),
        });
      }
    }

    return tx.card.findUniqueOrThrow({
      where: { id: updated.id },
      include: cardInclude,
    });
  });
}

export async function deleteCard(user: Express.UserPayload, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: {
        select: {
          id: true,
          boardId: true,
          board: {
            select: {
              ownerId: true,
              members: {
                select: {
                  userId: true,
                  role: true,
                  canManageCards: true,
                },
              },
            },
          },
        },
      },
      createdById: true,
      assignments: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              managerId: true,
            },
          },
        },
      },
    },
  });

  if (!card) {
    throw new HttpError(404, "Карточка не найдена");
  }

  ensureCardManageRights(user, card.list.board, card, true);

  await prisma.card.delete({ where: { id: cardId } });
}

export async function getCard(user: Express.UserPayload, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: cardInclude,
  });
  if (!card) {
    throw new HttpError(404, "Карточка не найдена");
  }

  if (user.role !== UserRole.ADMIN) {
    const board = await prisma.board.findUnique({
      where: { id: card.list.boardId },
      select: { ownerId: true },
    });
    if (!board) {
      throw new HttpError(404, "Доска не найдена");
    }
    if (board.ownerId !== user.userId) {
      const membership = await prisma.boardMember.findFirst({
        where: { boardId: card.list.boardId, userId: user.userId },
      });
      if (!membership) {
        throw new HttpError(403, "Нет доступа к карточке");
      }
    }
  }

  return card;
}

function ensureCardCreationRights(
  user: Express.UserPayload,
  list: {
    boardId: string;
    board: {
      ownerId: string;
      members: Array<{ userId: string; role: BoardRole; canManageCards: boolean }>;
    };
  }
) {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const isOwner = list.board.ownerId === user.userId;
  const membership = list.board.members[0];

  if (!isOwner && !membership) {
    throw new HttpError(403, "Нет доступа к этой доске");
  }

  if (user.role === UserRole.LEAD) {
    return;
  }

  if (user.role === UserRole.EMPLOYEE && !membership) {
    throw new HttpError(403, "Сотрудник должен быть участником доски");
  }
}

function ensureCardManageRights(
  user: Express.UserPayload,
  board: {
    ownerId: string;
    members: Array<{ userId: string; role: BoardRole; canManageCards: boolean }>;
  },
  card: {
    createdById: string;
    assignments: Array<{ userId: string; user: { managerId: string | null } }>;
  },
  isDelete = false
) {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const membership = board.members.find((member) => member.userId === user.userId);
  const isOwner = board.ownerId === user.userId;

  if (!isOwner && !membership) {
    throw new HttpError(403, "Нет доступа к этой доске");
  }

  if (isOwner || membership?.role === BoardRole.OWNER || membership?.role === BoardRole.MANAGER) {
    return;
  }

  const isCreator = card.createdById === user.userId;
  const isAssigned = card.assignments.some((assignment) => assignment.userId === user.userId);
  const managesAssignee = card.assignments.some((assignment) => assignment.user.managerId === user.userId);

  if (user.role === UserRole.LEAD && (isCreator || managesAssignee || isAssigned)) {
    return;
  }

  if (user.role === UserRole.EMPLOYEE) {
    if (isCreator || isAssigned) {
      return;
    }
  }

  throw new HttpError(403, isDelete ? "Нет доступа к удалению карточки" : "Нет доступа к редактированию карточки");
}

async function resolvePositionForCard(
  listId: string,
  desiredPosition?: number,
  tx?: Prisma.TransactionClient
) {
  if (desiredPosition !== undefined) {
    return desiredPosition;
  }
  const client = tx ?? prisma;
  const aggregate = await client.card.aggregate({
    where: { listId },
    _max: { position: true },
  });
  return (aggregate._max.position ?? 0) + 1;
}

async function ensureAssigneesAllowed(user: Express.UserPayload, boardId: string, assigneeIds: string[]) {
  if (!assigneeIds.length || user.role === UserRole.ADMIN) {
    return;
  }

  let allowedIds: Set<string>;

  if (user.role === UserRole.LEAD) {
    const subordinates = await prisma.user.findMany({
      where: { managerId: user.userId },
      select: { id: true },
    });
    allowedIds = new Set([user.userId, ...subordinates.map((row) => row.id)]);
  } else {
    allowedIds = new Set([user.userId]);
  }

  const invalid = assigneeIds.filter((id) => !allowedIds.has(id));
  if (invalid.length) {
    throw new HttpError(403, "Нельзя назначить пользователей без соответствующих прав");
  }

  const memberships = await prisma.boardMember.findMany({
    where: {
      boardId,
      userId: { in: assigneeIds },
    },
    select: { userId: true },
  });
  const memberIds = new Set(memberships.map((row) => row.userId));
  const missing = assigneeIds.filter((id) => !memberIds.has(id));
  if (missing.length) {
    throw new HttpError(400, "Все исполнители должны быть участниками доски");
  }
}
