import { z } from "zod";
import { BoardRole } from "@prisma/client";

export const createBoardSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  ownerId: z.string().uuid().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const updateBoardSchema = createBoardSchema.partial();

export const updateBoardMembersSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: z.nativeEnum(BoardRole).optional(),
        canManageCards: z.boolean().optional(),
      })
    )
    .min(1),
});

export const boardIdParamsSchema = z.object({
  id: z.string().uuid(),
});
