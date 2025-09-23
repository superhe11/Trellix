import { BoardRole, UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";

export async function listLeadsWithBoards() {
  const leads = await prisma.user.findMany({
    where: { role: UserRole.LEAD },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      memberships: {
        select: {
          role: true,
          board: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return leads.map((lead) => ({
    id: lead.id,
    email: lead.email,
    fullName: lead.fullName,
    boards: lead.memberships.map((m) => ({ id: m.board.id, title: m.board.title, role: m.role })),
  }));
}

export async function listAllBoardsMinimal() {
  return prisma.board.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function setLeadBoards(leadId: string, boardIds: string[]) {
  const lead = await prisma.user.findUnique({ where: { id: leadId }, select: { id: true, role: true } });
  if (!lead) {
    throw new HttpError(404, "Руководитель не найден");
  }
  if (lead.role !== UserRole.LEAD) {
    throw new HttpError(400, "Назначать доски можно только пользователю с ролью LEAD");
  }

  const uniqueBoardIds = Array.from(new Set(boardIds));
  const boards = await prisma.board.findMany({ where: { id: { in: uniqueBoardIds } }, select: { id: true, ownerId: true } });
  const foundIds = new Set(boards.map((b) => b.id));
  const missing = uniqueBoardIds.filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new HttpError(400, "Некоторые доски не найдены");
  }

  const ownerBoardIds = boards.filter((b) => b.ownerId === leadId).map((b) => b.id);
  const targetNonOwnerBoardIds = uniqueBoardIds.filter((id) => !ownerBoardIds.includes(id));

  await prisma.$transaction(async (tx) => {
    // Remove existing non-owner memberships that are not in the new list
    await tx.boardMember.deleteMany({
      where: {
        userId: leadId,
        role: { not: BoardRole.OWNER },
        boardId: { notIn: targetNonOwnerBoardIds },
      },
    });

    // Upsert MANAGER membership for each target board (skip owner boards)
    for (const boardId of targetNonOwnerBoardIds) {
      const existing = await tx.boardMember.findFirst({ where: { boardId, userId: leadId } });
      if (!existing) {
        await tx.boardMember.create({
          data: {
            boardId,
            userId: leadId,
            role: BoardRole.MANAGER,
            canManageCards: true,
          },
        });
      } else if (existing.role !== BoardRole.OWNER && existing.role !== BoardRole.MANAGER) {
        await tx.boardMember.update({ where: { id: existing.id }, data: { role: BoardRole.MANAGER, canManageCards: true } });
      }
    }
  });

  // Return updated mapping
  const updated = await prisma.user.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      fullName: true,
      email: true,
      memberships: {
        select: {
          role: true,
          board: { select: { id: true, title: true } },
        },
      },
    },
  });

  return {
    id: updated!.id,
    fullName: updated!.fullName,
    email: updated!.email,
    boards: updated!.memberships.map((m) => ({ id: m.board.id, title: m.board.title, role: m.role })),
  };
}


