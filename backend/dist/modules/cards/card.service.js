"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;
exports.getCard = getCard;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const http_error_1 = require("../../utils/http-error");
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
};
async function createCard(user, listId, payload) {
    const list = await prisma_1.prisma.list.findUnique({
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
        throw new http_error_1.HttpError(404, "Список не найден");
    }
    ensureCardCreationRights(user, list);
    const assigneeIds = Array.from(new Set(payload.assigneeIds ?? []));
    await ensureAssigneesAllowed(user, list.boardId, assigneeIds);
    const dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
    const position = await resolvePositionForCard(listId, payload.position);
    const card = await prisma_1.prisma.card.create({
        data: {
            title: payload.title,
            description: payload.description,
            position,
            status: client_1.CardStatus.TODO,
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
async function updateCard(user, cardId, payload) {
    const card = await prisma_1.prisma.card.findUnique({
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
        throw new http_error_1.HttpError(404, "Карточка не найдена");
    }
    ensureCardManageRights(user, card.list.board, card);
    const assigneeIds = payload.assigneeIds ? Array.from(new Set(payload.assigneeIds)) : undefined;
    if (assigneeIds) {
        await ensureAssigneesAllowed(user, card.list.boardId, assigneeIds);
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        let targetListId = card.list.id;
        if (payload.listId && payload.listId !== card.list.id) {
            const targetList = await tx.list.findUnique({
                where: { id: payload.listId },
                select: { id: true, boardId: true },
            });
            if (!targetList) {
                throw new http_error_1.HttpError(404, "Целевой список не найден");
            }
            if (targetList.boardId !== card.list.boardId) {
                throw new http_error_1.HttpError(400, "Карточку нельзя перенести на другую доску");
            }
            targetListId = targetList.id;
        }
        const position = await resolvePositionForCard(targetListId, payload.position, tx);
        const dueDate = payload.dueDate === undefined ? undefined : payload.dueDate ? new Date(payload.dueDate) : null;
        const updated = await (tx ?? prisma_1.prisma).card.update({
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
                await (tx ?? prisma_1.prisma).cardAssignment.deleteMany({
                    where: {
                        cardId,
                        userId: { in: toDelete },
                    },
                });
            }
            const existing = new Set(card.assignments.map((assignment) => assignment.userId));
            const toCreate = assigneeIds.filter((id) => !existing.has(id));
            if (toCreate.length) {
                await (tx ?? prisma_1.prisma).cardAssignment.createMany({
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
async function deleteCard(user, cardId) {
    const card = await prisma_1.prisma.card.findUnique({
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
        throw new http_error_1.HttpError(404, "Карточка не найдена");
    }
    ensureCardManageRights(user, card.list.board, card, true);
    await prisma_1.prisma.card.delete({ where: { id: cardId } });
}
async function getCard(user, cardId) {
    const card = await prisma_1.prisma.card.findUnique({
        where: { id: cardId },
        include: cardInclude,
    });
    if (!card) {
        throw new http_error_1.HttpError(404, "Карточка не найдена");
    }
    if (user.role !== client_1.UserRole.ADMIN) {
        const board = await prisma_1.prisma.board.findUnique({
            where: { id: card.list.boardId },
            select: { ownerId: true },
        });
        if (!board) {
            throw new http_error_1.HttpError(404, "Доска не найдена");
        }
        if (board.ownerId !== user.userId) {
            const membership = await prisma_1.prisma.boardMember.findFirst({
                where: { boardId: card.list.boardId, userId: user.userId },
            });
            if (!membership) {
                throw new http_error_1.HttpError(403, "Нет доступа к карточке");
            }
        }
    }
    return card;
}
function ensureCardCreationRights(user, list) {
    if (user.role === client_1.UserRole.ADMIN) {
        return;
    }
    const isOwner = list.board.ownerId === user.userId;
    const membership = list.board.members[0];
    if (!isOwner && !membership) {
        throw new http_error_1.HttpError(403, "Нет доступа к этой доске");
    }
    if (user.role === client_1.UserRole.LEAD) {
        return;
    }
    if (user.role === client_1.UserRole.EMPLOYEE && !membership) {
        throw new http_error_1.HttpError(403, "Сотрудник должен быть участником доски");
    }
}
function ensureCardManageRights(user, board, card, isDelete = false) {
    if (user.role === client_1.UserRole.ADMIN) {
        return;
    }
    const membership = board.members.find((member) => member.userId === user.userId);
    const isOwner = board.ownerId === user.userId;
    if (!isOwner && !membership) {
        throw new http_error_1.HttpError(403, "Нет доступа к этой доске");
    }
    if (isOwner || membership?.role === client_1.BoardRole.OWNER || membership?.role === client_1.BoardRole.MANAGER) {
        return;
    }
    const isCreator = card.createdById === user.userId;
    const isAssigned = card.assignments.some((assignment) => assignment.userId === user.userId);
    const managesAssignee = card.assignments.some((assignment) => assignment.user.managerId === user.userId);
    if (user.role === client_1.UserRole.LEAD && (isCreator || managesAssignee || isAssigned)) {
        return;
    }
    if (user.role === client_1.UserRole.EMPLOYEE) {
        if (isCreator || isAssigned) {
            return;
        }
    }
    throw new http_error_1.HttpError(403, isDelete ? "Нет доступа к удалению карточки" : "Нет доступа к редактированию карточки");
}
async function resolvePositionForCard(listId, desiredPosition, tx) {
    if (desiredPosition !== undefined) {
        return desiredPosition;
    }
    const client = tx ?? prisma_1.prisma;
    const aggregate = await client.card.aggregate({
        where: { listId },
        _max: { position: true },
    });
    return (aggregate._max.position ?? 0) + 1;
}
async function ensureAssigneesAllowed(user, boardId, assigneeIds) {
    if (!assigneeIds.length || user.role === client_1.UserRole.ADMIN) {
        return;
    }
    let allowedIds;
    if (user.role === client_1.UserRole.LEAD) {
        const subordinates = await prisma_1.prisma.user.findMany({
            where: { managerId: user.userId },
            select: { id: true },
        });
        allowedIds = new Set([user.userId, ...subordinates.map((row) => row.id)]);
    }
    else {
        allowedIds = new Set([user.userId]);
    }
    const invalid = assigneeIds.filter((id) => !allowedIds.has(id));
    if (invalid.length) {
        throw new http_error_1.HttpError(403, "Нельзя назначить пользователей без соответствующих прав");
    }
    const memberships = await prisma_1.prisma.boardMember.findMany({
        where: {
            boardId,
            userId: { in: assigneeIds },
        },
        select: { userId: true },
    });
    const memberIds = new Set(memberships.map((row) => row.userId));
    const missing = assigneeIds.filter((id) => !memberIds.has(id));
    if (missing.length) {
        throw new http_error_1.HttpError(400, "Все исполнители должны быть участниками доски");
    }
}
//# sourceMappingURL=card.service.js.map