import { BoardRole, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";

const boardSummaryInclude = {
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  members: {
    select: {
      id: true,
      role: true,
      canManageCards: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  },
  lists: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      position: true,
    },
  },
} as const;

const boardDetailInclude = {
  owner: boardSummaryInclude.owner,
  members: boardSummaryInclude.members,
  lists: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      cards: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          status: true,
          dueDate: true,
          archived: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignments: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function listBoardsForUser(user: Express.UserPayload) {
  if (user.role === UserRole.ADMIN) {
    const boards = await prisma.board.findMany({
      orderBy: { updatedAt: "desc" },
      include: boardSummaryInclude,
    });

    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const memberUserIds = board.members.map((m) => m.user.id);
        const nonAdminMembersCount = board.members.filter((m) => m.user.role !== UserRole.ADMIN).length;
        const subordinateEmployeesCount = await prisma.user.count({
          where: { managerId: board.ownerId, role: UserRole.EMPLOYEE, id: { notIn: memberUserIds } },
        });
        const accessCount = nonAdminMembersCount + subordinateEmployeesCount;
        return { ...board, accessCount } as typeof board & { accessCount: number };
      })
    );
    return boardsWithCounts;
  }

  const visibilityFilters: Prisma.BoardWhereInput[] = [
    { ownerId: user.userId },
    { members: { some: { userId: user.userId } } },
  ];

  if (user.role === UserRole.EMPLOYEE) {
    visibilityFilters.push(
      {
        owner: {
          is: {
            subordinates: {
              some: { id: user.userId },
            },
          },
        },
      },
      {
        members: {
          some: {
            user: {
              role: UserRole.LEAD,
              subordinates: { some: { id: user.userId } },
            },
          },
        },
      }
    );
  }

  const boards = await prisma.board.findMany({
    where: {
      OR: visibilityFilters,
    },
    orderBy: { updatedAt: "desc" },
    include: boardSummaryInclude,
  });

  const boardsWithCounts = await Promise.all(
    boards.map(async (board) => {
      const memberUserIds = board.members.map((m) => m.user.id);
      const nonAdminMembersCount = board.members.filter((m) => m.user.role !== UserRole.ADMIN).length;
      const leadManagerIds = [board.ownerId, ...board.members.filter((m) => m.user.role === UserRole.LEAD).map((m) => m.user.id)];
      const subordinateEmployees = await prisma.user.findMany({
        where: { managerId: { in: leadManagerIds }, role: UserRole.EMPLOYEE, id: { notIn: memberUserIds } },
        distinct: ["id"],
        select: { id: true },
      });
      const accessCount = nonAdminMembersCount + subordinateEmployees.length;
      return { ...board, accessCount } as typeof board & { accessCount: number };
    })
  );
  return boardsWithCounts;
}

export async function getBoardById(user: Express.UserPayload, boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: boardDetailInclude,
  });

  if (!board) {
    throw new HttpError(404, "Доска не найдена");
  }

  let isManagedEmployee = false;

  if (user.role === UserRole.EMPLOYEE) {
    const employee = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { managerId: true },
    });
    const managerId = employee?.managerId ?? null;
    if (managerId) {
      const managerIsOwner = managerId === board.ownerId;
      const managerIsMember = board.members.some((member) => member.user.id === managerId && member.user.role === UserRole.LEAD);
      isManagedEmployee = managerIsOwner || managerIsMember;
    }
  }

  if (user.role !== UserRole.ADMIN) {
    const isMember =
      board.ownerId === user.userId || board.members.some((member) => member.user.id === user.userId);
    if (!isMember && !isManagedEmployee) {
      throw new HttpError(403, "Нет доступа к доске");
    }
  }

  return board;
}

export async function createBoard(
  user: Express.UserPayload,
  payload: { title: string; description?: string; ownerId?: string; memberIds?: string[] }
) {
  if (user.role === UserRole.EMPLOYEE) {
    throw new HttpError(403, "Нет доступа к доске");
  }

  const ownerId = user.role === UserRole.ADMIN && payload.ownerId ? payload.ownerId : user.userId;

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) {
    throw new HttpError(400, "Владелец не найден");
  }
  if (owner.role !== UserRole.ADMIN && owner.role !== UserRole.LEAD) {
    throw new HttpError(400, "Владелец доски должен быть администратором или руководителем");
  }
  if (user.role === UserRole.LEAD && ownerId !== user.userId) {
    throw new HttpError(403, "Руководитель не может назначать владельцем другого пользователя");
  }

  const memberIds = Array.from(new Set(payload.memberIds ?? [])).filter((id) => id !== ownerId);

  if (user.role === UserRole.LEAD) {
    const subordinateIds = await prisma.user
      .findMany({
        where: { managerId: user.userId },
        select: { id: true },
      })
      .then((rows) => rows.map((row) => row.id));
    const allowed = new Set([...subordinateIds, user.userId]);
    const invalid = memberIds.filter((id) => !allowed.has(id));
    if (invalid.length > 0) {
      throw new HttpError(403, "Можно добавить только своих подчиненных");
    }
  }

  const board = await prisma.board.create({
    data: {
      title: payload.title,
      description: payload.description,
      ownerId,
      members: {
        create: [
          {
            userId: ownerId,
            role: BoardRole.OWNER,
            canManageCards: true,
          },
          ...memberIds.map((userId) => ({
            userId,
            role: BoardRole.COLLABORATOR,
            canManageCards: false,
          })),
        ],
      },
    },
    include: boardDetailInclude,
  });

  return board;
}

export async function updateBoard(
  user: Express.UserPayload,
  boardId: string,
  payload: { title?: string; description?: string }
) {
  await assertBoardManageAccess(user, boardId);

  const board = await prisma.board.update({
    where: { id: boardId },
    data: {
      title: payload.title,
      description: payload.description,
    },
    include: boardDetailInclude,
  });

  return board;
}

export async function deleteBoard(user: Express.UserPayload, boardId: string) {
  await assertBoardManageAccess(user, boardId);
  await prisma.board.delete({ where: { id: boardId } });
}

export async function updateBoardMembers(
  user: Express.UserPayload,
  boardId: string,
  payload: { members: Array<{ userId: string; role?: BoardRole; canManageCards?: boolean }> }
) {
  await assertBoardManageAccess(user, boardId);

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: true,
      owner: true,
    },
  });

  if (!board) {
    throw new HttpError(404, "Доска не найдена");
  }

  const ownerMember = board.members.find((member) => member.role === BoardRole.OWNER);
  const membersToKeep = ownerMember ? [ownerMember.userId] : [board.ownerId];

  const data = payload.members.filter((m) => !membersToKeep.includes(m.userId));

  if (user.role === UserRole.LEAD) {
    const subordinateIds = await prisma.user
      .findMany({ where: { managerId: user.userId }, select: { id: true } })
      .then((rows) => rows.map((row) => row.id));
    const allowed = new Set([...subordinateIds, user.userId]);
    const invalid = data.filter((member) => !allowed.has(member.userId));
    if (invalid.length) {
      throw new HttpError(403, "Можно добавлять только своих подчиненных");
    }
  }

  await prisma.$transaction([
    prisma.boardMember.deleteMany({
      where: {
        boardId,
        role: { not: BoardRole.OWNER },
      },
    }),
    prisma.boardMember.createMany({
      data: data.map((member) => ({
        boardId,
        userId: member.userId,
        role: member.role ?? BoardRole.COLLABORATOR,
        canManageCards: member.canManageCards ?? false,
      })),
    }),
  ]);

  return getBoardById(user, boardId);
}

async function assertBoardManageAccess(user: Express.UserPayload, boardId: string) {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: { select: { id: true } },
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  if (!board) {
    throw new HttpError(404, "Доска не найдена");
  }

  if (board.ownerId === user.userId) {
    return;
  }

  const member = board.members.find((m) => m.userId === user.userId);
  if (!member) {
    throw new HttpError(403, "Нет доступа к доске");
  }

  if (member.role !== BoardRole.MANAGER && member.role !== BoardRole.OWNER) {
    throw new HttpError(403, "Нет доступа к доске");
  }
}














