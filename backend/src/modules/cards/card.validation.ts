import { z } from "zod";
import { CardStatus } from "@prisma/client";

export const createCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  position: z.number().int().nonnegative().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.nativeEnum(CardStatus).optional(),
  position: z.number().int().nonnegative().optional(),
  listId: z.string().uuid().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  archived: z.boolean().optional(),
});

export const cardIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listIdParamsSchema = z.object({
  listId: z.string().uuid(),
});

export const searchCardsQuerySchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().int().positive().max(50).optional(),
});
