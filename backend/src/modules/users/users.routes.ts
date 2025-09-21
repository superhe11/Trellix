import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/require-role";
import { validate } from "../../middleware/validate";
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  updateUserHandler,
} from "./users.controller";
import { createUserSchema, queryUsersSchema, updateUserSchema } from "./users.validation";

export const adminUsersRouter = Router();

adminUsersRouter.use(authenticate, requireRole(UserRole.ADMIN));

adminUsersRouter.get("/", validate({ query: queryUsersSchema.partial() }), listUsersHandler);

adminUsersRouter.post("/", validate({ body: createUserSchema }), createUserHandler);

adminUsersRouter.patch("/:id", validate({ body: updateUserSchema }), updateUserHandler);

adminUsersRouter.delete("/:id", deleteUserHandler);
