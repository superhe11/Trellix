import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { createUser, deleteUser, listUsers, updateUser } from "./users.service";
import { queryUsersSchema } from "./users.validation";
import { z } from "zod";

type ListUsersFilters = z.infer<typeof queryUsersSchema>;

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const users = await listUsers(req.query as ListUsersFilters);
  res.json({ users });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  res.status(201).json({ user });
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new HttpError(400, "ID пользователя обязателен");
  }
  const user = await updateUser(id, req.body);
  res.json({ user });
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new HttpError(400, "ID пользователя обязателен");
  }
  await deleteUser(id);
  res.status(204).send();
});
