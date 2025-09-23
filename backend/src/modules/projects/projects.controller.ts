import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { listAllBoardsMinimal, listLeadsWithBoards, setLeadBoards } from "./projects.service";

export const listProjectsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const [leads, boards] = await Promise.all([listLeadsWithBoards(), listAllBoardsMinimal()]);
  res.json({ leads, boards });
});

export const setLeadBoardsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const { leadId } = req.params as { leadId: string };
  const { boardIds } = req.body as { boardIds: string[] };
  const lead = await setLeadBoards(leadId, boardIds ?? []);
  res.json({ lead });
});


