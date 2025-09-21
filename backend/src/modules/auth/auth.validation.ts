import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  fullName: z.string().min(2).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

