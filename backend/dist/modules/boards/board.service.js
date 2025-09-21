"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoardsForUser = listBoardsForUser;
exports.getBoardById = getBoardById;
exports.createBoard = createBoard;
exports.updateBoard = updateBoard;
exports.deleteBoard = deleteBoard;
exports.updateBoardMembers = updateBoardMembers;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const http_error_1 = require("../../utils/http-error");
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
};
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
};
async function listBoardsForUser(user) {
    if (user.role === client_1.UserRole.ADMIN) {
        return prisma_1.prisma.board.findMany({
            orderBy: { updatedAt: "desc" },
            include: boardSummaryInclude,
        });
    }
    return prisma_1.prisma.board.findMany({
        where: {
            OR: [
                { ownerId: user.userId },
                { members: { some: { userId: user.userId } } },
            ],
        },
        orderBy: { updatedAt: "desc" },
        include: boardSummaryInclude,
    });
}
async function getBoardById(user, boardId) {
    const board = await prisma_1.prisma.board.findUnique({
        where: { id: boardId },
        include: boardDetailInclude,
    });
    if (!board) {
        throw new http_error_1.HttpError(404, "Доска не найдена");
    }
    if (user.role !== client_1.UserRole.ADMIN) {
        const isMember = board.ownerId === user.userId || board.members.some((member) => member.user.id === user.userId);
        if (!isMember) {
            throw new http_error_1.HttpError(403, "Нет доступа к доске");
        }
    }
    return board;
}
async function createBoard(user, payload) {
    if (user.role === client_1.UserRole.EMPLOYEE) {
        throw new http_error_1.HttpError(403, "Сотрудники не могут создавать доски");
    }
    const ownerId = user.role === client_1.UserRole.ADMIN && payload.ownerId ? payload.ownerId : user.userId;
    const owner = await prisma_1.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
        throw new http_error_1.HttpError(400, "Владелец не найден");
    }
    if (owner.role !== client_1.UserRole.ADMIN && owner.role !== client_1.UserRole.LEAD) {
        throw new http_error_1.HttpError(400, "Владелец доски должен быть администратором или руководителем");
    }
    if (user.role === client_1.UserRole.LEAD && ownerId !== user.userId) {
        throw new http_error_1.HttpError(403, "Руководитель не может назначать владельцем другого пользователя");
    }
    const memberIds = Array.from(new Set(payload.memberIds ?? [])).filter((id) => id !== ownerId);
    if (user.role === client_1.UserRole.LEAD) {
        const subordinateIds = await prisma_1.prisma.user
            .findMany({
            where: { managerId: user.userId },
            select: { id: true },
        })
            .then((rows) => rows.map((row) => row.id));
        const allowed = new Set([...subordinateIds, user.userId]);
        const invalid = memberIds.filter((id) => !allowed.has(id));
        if (invalid.length > 0) {
            throw new http_error_1.HttpError(403, "Можно добавить только своих подчиненных");
        }
    }
    const board = await prisma_1.prisma.board.create({
        data: {
            title: payload.title,
            description: payload.description,
            ownerId,
            members: {
                create: [
                    {
                        userId: ownerId,
                        role: client_1.BoardRole.OWNER,
                        canManageCards: true,
                    },
                    ...memberIds.map((userId) => ({
                        userId,
                        role: client_1.BoardRole.COLLABORATOR,
                        canManageCards: false,
                    })),
                ],
            },
        },
        include: boardDetailInclude,
    });
    return board;
}
async function updateBoard(user, boardId, payload) {
    await assertBoardManageAccess(user, boardId);
    const board = await prisma_1.prisma.board.update({
        where: { id: boardId },
        data: {
            title: payload.title,
            description: payload.description,
        },
        include: boardDetailInclude,
    });
    return board;
}
async function deleteBoard(user, boardId) {
    await assertBoardManageAccess(user, boardId);
    await prisma_1.prisma.board.delete({ where: { id: boardId } });
}
async function updateBoardMembers(user, boardId, payload) {
    await assertBoardManageAccess(user, boardId);
    const board = await prisma_1.prisma.board.findUnique({
        where: { id: boardId },
        include: {
            members: true,
            owner: true,
        },
    });
    if (!board) {
        throw new http_error_1.HttpError(404, "Доска не найдена");
    }
    const ownerMember = board.members.find((member) => member.role === client_1.BoardRole.OWNER);
    const membersToKeep = ownerMember ? [ownerMember.userId] : [board.ownerId];
    const data = payload.members.filter((m) => !membersToKeep.includes(m.userId));
    if (user.role === client_1.UserRole.LEAD) {
        const subordinateIds = await prisma_1.prisma.user
            .findMany({ where: { managerId: user.userId }, select: { id: true } })
            .then((rows) => rows.map((row) => row.id));
        const allowed = new Set([...subordinateIds, user.userId]);
        const invalid = data.filter((member) => !allowed.has(member.userId));
        if (invalid.length) {
            throw new http_error_1.HttpError(403, "Можно добавлять только своих подчиненных");
        }
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.boardMember.deleteMany({
            where: {
                boardId,
                role: { not: client_1.BoardRole.OWNER },
            },
        }),
        prisma_1.prisma.boardMember.createMany({
            data: data.map((member) => ({
                boardId,
                userId: member.userId,
                role: member.role ?? client_1.BoardRole.COLLABORATOR,
                canManageCards: member.canManageCards ?? false,
            })),
        }),
    ]);
    return getBoardById(user, boardId);
}
async function assertBoardManageAccess(user, boardId) {
    if (user.role === client_1.UserRole.ADMIN) {
        return;
    }
    const board = await prisma_1.prisma.board.findUnique({
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
        throw new http_error_1.HttpError(404, "Доска не найдена");
    }
    if (board.ownerId === user.userId) {
        return;
    }
    const member = board.members.find((m) => m.userId === user.userId);
    if (!member) {
        throw new http_error_1.HttpError(403, "Нет доступа к управлению доской");
    }
    if (member.role !== client_1.BoardRole.MANAGER && member.role !== client_1.BoardRole.OWNER) {
        throw new http_error_1.HttpError(403, "Только владельцы или менеджеры доски могут управлять ей");
    }
}
//# sourceMappingURL=board.service.js.map