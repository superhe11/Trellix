import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  listBoardsForUser,
  updateBoard,
  updateBoardMembers,
} from "./board.service";

export const listBoardsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const boards = await listBoardsForUser(req.user);
  res.json({ boards });
});

export const getBoardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const board = await getBoardById(req.user, req.params.id);
  res.json({ board });
});

export const createBoardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const board = await createBoard(req.user, req.body);
  res.status(201).json({ board });
});

export const updateBoardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const board = await updateBoard(req.user, req.params.id, req.body);
  res.json({ board });
});

export const deleteBoardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  await deleteBoard(req.user, req.params.id);
  res.status(204).send();
});

export const updateBoardMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const board = await updateBoardMembers(req.user, req.params.id, req.body);
  res.json({ board });
});
