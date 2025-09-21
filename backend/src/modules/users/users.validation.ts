import { z } from "zod";
import { UserRole } from "@prisma/client";

// Helper to treat empty string values as undefined for query params
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

export const queryUsersSchema = z.object({
  role: emptyToUndefined(z.nativeEnum(UserRole)).optional(),
  managerId: emptyToUndefined(z.string().uuid()).optional(),
  search: emptyToUndefined(z.string().min(1)).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  role: z.nativeEnum(UserRole),
  managerId: z.string().uuid().nullable().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.nativeEnum(UserRole).optional(),
  managerId: z.string().uuid().nullable().optional(),
});
