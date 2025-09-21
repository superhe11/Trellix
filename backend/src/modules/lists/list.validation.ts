import { z } from "zod";

export const createListSchema = z.object({
  title: z.string().min(1).max(120),
  position: z.number().int().nonnegative().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const listIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const boardIdParamsSchema = z.object({
  boardId: z.string().uuid(),
});
