import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { createList, deleteList, updateList } from "./list.service";

export const createListHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const list = await createList(req.user, req.params.boardId, req.body);
  res.status(201).json({ list });
});

export const updateListHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const list = await updateList(req.user, req.params.id, req.body);
  res.json({ list });
});

export const deleteListHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  await deleteList(req.user, req.params.id);
  res.status(204).send();
});
