import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { createTag, listBoardTags } from "./tag.service";

export const listBoardTagsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, "Требуется авторизация");
  const tags = await listBoardTags(req.user, req.params.boardId);
  res.json({ tags });
});

export const createTagHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, "Требуется авторизация");
  const tag = await createTag(req.user, req.params.boardId, req.body);
  res.status(201).json({ tag });
});