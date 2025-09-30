import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";
import { BoardRole, UserRole } from "@prisma/client";

async function ensureBoardAccess(user: Express.UserPayload, boardId: string) {
  if (user.role === UserRole.ADMIN) return;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      ownerId: true,
      members: { select: { userId: true, role: true } },
    },
  });
  if (!board) throw new HttpError(404, "Доска не найдена");

  const isOwner = board.ownerId === user.userId;
  const membership = board.members.find((m) => m.userId === user.userId);
  if (isOwner || membership) return;

  if (user.role === UserRole.EMPLOYEE) {
    const employee = await prisma.user.findUnique({ where: { id: user.userId }, select: { managerId: true } });
    if (employee?.managerId === board.ownerId) return;
    if (employee?.managerId) {
      const leadIsMember = board.members.some((m) => m.userId === employee.managerId);
      if (leadIsMember) return;
    }
  }
  throw new HttpError(403, "Нет доступа к этой доске");
}

export async function listBoardTags(user: Express.UserPayload, boardId: string) {
  await ensureBoardAccess(user, boardId);
  return prisma.tag.findMany({ where: { boardId }, orderBy: { name: "asc" } });
}

export async function createTag(user: Express.UserPayload, boardId: string, payload: { name: string; color: string }) {
  await ensureBoardAccess(user, boardId);
  try {
    const tag = await prisma.tag.create({ data: { boardId, name: payload.name, color: payload.color } });
    return tag;
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw new HttpError(409, "Тег с таким именем уже существует на доске");
    }
    throw err;
  }
}

