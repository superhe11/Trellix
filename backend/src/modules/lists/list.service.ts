import { BoardRole, UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";

export async function createList(
  user: Express.UserPayload,
  boardId: string,
  payload: { title: string; position?: number }
) {
  await ensureBoardWriteAccess(user, boardId);

  const position =
    payload.position ??
    (await prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    }))._max.position ?? 0;

  const list = await prisma.list.create({
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

export async function updateList(
  user: Express.UserPayload,
  listId: string,
  payload: { title?: string; position?: number }
) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    throw new HttpError(404, "Список не найден");
  }

  await ensureBoardWriteAccess(user, list.boardId);

  const updated = await prisma.list.update({
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

export async function deleteList(user: Express.UserPayload, listId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    throw new HttpError(404, "Список не найден");
  }
  await ensureBoardWriteAccess(user, list.boardId);
  await prisma.list.delete({ where: { id: listId } });
}

async function ensureBoardWriteAccess(user: Express.UserPayload, boardId: string) {
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const membership = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId: user.userId,
    },
    select: {
      role: true,
    },
  });

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });

  if (!board) {
    throw new HttpError(404, "Доска не найдена");
  }

  if (board.ownerId === user.userId) {
    return;
  }

  if (!membership) {
    throw new HttpError(403, "Нет доступа к редактированию доски");
  }

  if (membership.role !== BoardRole.MANAGER && membership.role !== BoardRole.OWNER) {
    throw new HttpError(403, "Недостаточно прав для управления списками");
  }
}

