import { z } from "zod";

export const boardIdParamsSchema = z.object({
  boardId: z.string().uuid(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20),
});