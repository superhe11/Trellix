"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createList = createList;
exports.updateList = updateList;
exports.deleteList = deleteList;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const http_error_1 = require("../../utils/http-error");
async function createList(user, boardId, payload) {
    await ensureBoardWriteAccess(user, boardId);
    const position = payload.position ??
        (await prisma_1.prisma.list.aggregate({
            where: { boardId },
            _max: { position: true },
        }))._max.position ?? 0;
    const list = await prisma_1.prisma.list.create({
        data: {
            title: payload.title,
            boardId,
            position: position + 1,
        },
        select: {
            id: true,
            title: true,
            position: true,
            boardId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return list;
}
async function updateList(user, listId, payload) {
    const list = await prisma_1.prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
        throw new http_error_1.HttpError(404, "Список не найден");
    }
    await ensureBoardWriteAccess(user, list.boardId);
    const updated = await prisma_1.prisma.list.update({
        where: { id: listId },
        data: {
            title: payload.title,
            position: payload.position,
        },
        select: {
            id: true,
            title: true,
            position: true,
            boardId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return updated;
}
async function deleteList(user, listId) {
    const list = await prisma_1.prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
        throw new http_error_1.HttpError(404, "Список не найден");
    }
    await ensureBoardWriteAccess(user, list.boardId);
    await prisma_1.prisma.list.delete({ where: { id: listId } });
}
async function ensureBoardWriteAccess(user, boardId) {
    if (user.role === client_1.UserRole.ADMIN) {
        return;
    }
    const membership = await prisma_1.prisma.boardMember.findFirst({
        where: {
            boardId,
            userId: user.userId,
        },
        select: {
            role: true,
        },
    });
    const board = await prisma_1.prisma.board.findUnique({
        where: { id: boardId },
        select: { ownerId: true },
    });
    if (!board) {
        throw new http_error_1.HttpError(404, "Доска не найдена");
    }
    if (board.ownerId === user.userId) {
        return;
    }
    if (!membership) {
        throw new http_error_1.HttpError(403, "Нет доступа к редактированию доски");
    }
    if (membership.role !== client_1.BoardRole.MANAGER && membership.role !== client_1.BoardRole.OWNER) {
        throw new http_error_1.HttpError(403, "Недостаточно прав для управления списками");
    }
}
//# sourceMappingURL=list.service.js.map