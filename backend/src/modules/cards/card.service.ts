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
  tags: {
    include: {
      tag: true,
    },
    orderBy: { position: "asc" as const },
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

  await ensureCardCreationRights(user, list);

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
    const isMovingBetweenLists = payload.listId && payload.listId !== card.list.id;

    if (isMovingBetweenLists) {
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

    // Если указана позиция, нужно пересчитать позиции других карточек
    if (payload.position !== undefined) {
      if (isMovingBetweenLists) {
        // Перемещение между списками: сдвигаем карточки в целевом списке
        await tx.card.updateMany({
          where: {
            listId: targetListId,
            position: { gte: payload.position },
          },
          data: {
            position: { increment: 1 },
          },
        });
        
        // Сжимаем позиции в исходном списке
        await tx.card.updateMany({
          where: {
            listId: card.list.id,
            position: { gt: (await tx.card.findUnique({ where: { id: cardId }, select: { position: true } }))?.position || 0 },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        // Перемещение внутри списка
        const currentCard = await tx.card.findUnique({
          where: { id: cardId },
          select: { position: true },
        });
        
        if (currentCard && currentCard.position !== payload.position) {
          if (payload.position > currentCard.position) {
            // Перемещение вниз: сдвигаем карточки между старой и новой позицией вверх
            await tx.card.updateMany({
              where: {
                listId: targetListId,
                position: { gt: currentCard.position, lte: payload.position },
                id: { not: cardId },
              },
              data: {
                position: { decrement: 1 },
              },
            });
          } else {
            // Перемещение вверх: сдвигаем карточки между новой и старой позицией вниз
            await tx.card.updateMany({
              where: {
                listId: targetListId,
                position: { gte: payload.position, lt: currentCard.position },
                id: { not: cardId },
              },
              data: {
                position: { increment: 1 },
              },
            });
          }
        }
      }
    }

    const position = payload.position ?? (await resolvePositionForCard(targetListId, undefined, tx));
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

export async function searchCards(user: Express.UserPayload, query: string, limit: number) {
  // Find visible boards for the user
  const visibleBoardIds = await (async () => {
    if (user.role === UserRole.ADMIN) {
      const boards = await prisma.board.findMany({ select: { id: true } });
      return boards.map((b) => b.id);
    }
    const owned = await prisma.board.findMany({ where: { ownerId: user.userId }, select: { id: true } });
    const memberBoards = await prisma.boardMember.findMany({ where: { userId: user.userId }, select: { boardId: true } });
    const ids = new Set<string>([...owned.map((b) => b.id), ...memberBoards.map((m) => m.boardId)]);
    if (user.role === UserRole.EMPLOYEE) {
      const employee = await prisma.user.findUnique({ where: { id: user.userId }, select: { managerId: true } });
      if (employee?.managerId) {
        const managedBoards = await prisma.board.findMany({ where: { ownerId: employee.managerId }, select: { id: true } });
        const leadMemberBoards = await prisma.boardMember.findMany({
          where: { userId: employee.managerId },
          select: { boardId: true },
        });
        managedBoards.forEach((b) => ids.add(b.id));
        leadMemberBoards.forEach((m) => ids.add(m.boardId));
      }
    }
    return Array.from(ids);
  })();

  if (!visibleBoardIds.length) {
    return [] as Array<{ id: string; title: string; boardId: string; listId: string; listTitle: string; boardTitle: string }>;
  }

  const cards = await prisma.card.findMany({
    where: {
      list: { boardId: { in: visibleBoardIds } },
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      listId: true,
      list: { select: { id: true, title: true, boardId: true, board: { select: { id: true, title: true } } } },
    },
  });

  return cards.map((c) => ({
    id: c.id,
    title: c.title,
    boardId: c.list.boardId,
    listId: c.list.id,
    listTitle: c.list.title,
    boardTitle: c.list.board.title,
  }));
}

export async function attachTagToCard(user: Express.UserPayload, cardId: string, tagId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: { select: { boardId: true, board: { select: { ownerId: true, members: { select: { userId: true, role: true, canManageCards: true } } } } } },
      createdById: true,
      assignments: { select: { userId: true, user: { select: { managerId: true } } } },
    },
  });
  if (!card) throw new HttpError(404, "Карточка не найдена");
  ensureCardManageRights(user, card.list.board, card);

  const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { id: true, boardId: true } });
  if (!tag) throw new HttpError(404, "Тег не найден");
  if (tag.boardId !== card.list.boardId) throw new HttpError(400, "Тег принадлежит другой доске");

  // Find next position
  const max = await prisma.cardTag.aggregate({ where: { cardId }, _max: { position: true } });
  const position = (max._max.position ?? 0) + 1;

  await prisma.cardTag.create({ data: { cardId, tagId, position } });

  return prisma.card.findUnique({ where: { id: cardId }, include: cardInclude });
}

export async function detachTagFromCard(user: Express.UserPayload, cardId: string, tagId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: { select: { boardId: true, board: { select: { ownerId: true, members: { select: { userId: true, role: true, canManageCards: true } } } } } },
      createdById: true,
      assignments: { select: { userId: true, user: { select: { managerId: true } } } },
    },
  });
  if (!card) throw new HttpError(404, "Карточка не найдена");
  ensureCardManageRights(user, card.list.board, card);

  await prisma.cardTag.delete({ where: { cardId_tagId: { cardId, tagId } } });

  return prisma.card.findUnique({ where: { id: cardId }, include: cardInclude });
}

export async function reorderCardTags(user: Express.UserPayload, cardId: string, tagIds: string[]) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: { select: { boardId: true, board: { select: { ownerId: true, members: { select: { userId: true, role: true, canManageCards: true } } } } } },
      createdById: true,
      assignments: { select: { userId: true, user: { select: { managerId: true } } } },
    },
  });
  if (!card) throw new HttpError(404, "Карточка не найдена");
  ensureCardManageRights(user, card.list.board, card);

  const existing = await prisma.cardTag.findMany({ where: { cardId }, select: { tagId: true } });
  const existingSet = new Set(existing.map((e) => e.tagId));
  if (existingSet.size !== tagIds.length || tagIds.some((id) => !existingSet.has(id))) {
    throw new HttpError(400, "Список тегов должен содержать все текущие теги карточки");
  }

  await prisma.$transaction(
    tagIds.map((tagId, index) =>
      prisma.cardTag.update({ where: { cardId_tagId: { cardId, tagId } }, data: { position: index + 1 } })
    )
  );

  return prisma.card.findUnique({ where: { id: cardId }, include: cardInclude });
}

export async function toggleFavoriteTag(user: Express.UserPayload, cardId: string, tagId: string, isFavorite: boolean) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      list: { select: { boardId: true, board: { select: { ownerId: true, members: { select: { userId: true, role: true, canManageCards: true } } } } } },
      createdById: true,
      assignments: { select: { userId: true, user: { select: { managerId: true } } } },
    },
  });
  if (!card) throw new HttpError(404, "Карточка не найдена");
  ensureCardManageRights(user, card.list.board, card);

  return prisma.$transaction(async (tx) => {
    const tags = await tx.cardTag.findMany({ where: { cardId }, orderBy: { position: 'asc' } });

    if (isFavorite) {
      // Сбрасываем избранный у всех
      await tx.cardTag.updateMany({ where: { cardId }, data: { isFavorite: false } });
      // Назначаем избранный выбранному тегу
      await tx.cardTag.update({ where: { cardId_tagId: { cardId, tagId } }, data: { isFavorite: true } });

      // Перемещаем выбранный тег наверх (position = 1), переназначаем позиции остальным
      const otherTags = tags.filter((t) => t.tagId !== tagId);
      await tx.cardTag.update({ where: { cardId_tagId: { cardId, tagId } }, data: { position: 1 } });
      let pos = 2;
      for (const t of otherTags) {
        await tx.cardTag.update({ where: { cardId_tagId: { cardId, tagId: t.tagId } }, data: { position: pos } });
        pos += 1;
      }
    } else {
      await tx.cardTag.update({ where: { cardId_tagId: { cardId, tagId } }, data: { isFavorite: false } });
      // Не меняем порядок при снятии избранного
    }

    return tx.card.findUnique({ where: { id: cardId }, include: cardInclude });
  });
}

async function ensureCardCreationRights(
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

  if (isOwner) {
    return;
  }

  if (!membership) {
    if (user.role === UserRole.EMPLOYEE) {
      const employee = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { managerId: true },
      });
      // allow if employee's manager owns the board
      if (employee?.managerId === list.board.ownerId) {
        return;
      }
      // also allow if employee's manager is an explicit member of the board
      if (employee?.managerId) {
        const managerIsBoardMember = await prisma.boardMember.findFirst({
          where: { boardId: list.boardId, userId: employee.managerId },
          select: { id: true },
        });
        if (managerIsBoardMember) {
          return;
        }
      }
    }
    throw new HttpError(403, "Нет доступа к доске");
  }

  if (user.role === UserRole.LEAD) {
    return;
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

  // Full access if board owner or board manager/owner member
  if (isOwner || membership?.role === BoardRole.OWNER || membership?.role === BoardRole.MANAGER) {
    return;
  }

  const isCreator = card.createdById === user.userId;
  const isAssigned = card.assignments.some((assignment) => assignment.userId === user.userId);
  const managesAssignee = card.assignments.some((assignment) => assignment.user.managerId === user.userId);

  // Leads can manage cards they created, assigned to, or for their subordinates
  if (user.role === UserRole.LEAD && (isCreator || managesAssignee || isAssigned)) {
    return;
  }

  // Employees can manage their own cards or those where they are assignees
  if (user.role === UserRole.EMPLOYEE && (isCreator || isAssigned)) {
    return;
  }

  // If the user is neither owner nor member with privileges and none of the above individual conditions matched
  if (!isOwner && !membership) {
    throw new HttpError(403, "Нет доступа к этой доске");
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

