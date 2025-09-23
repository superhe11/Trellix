import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { createCard, deleteCard, getCard, searchCards, updateCard } from "./card.service";
import { searchCardsQuerySchema } from "./card.validation";

export const createCardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const card = await createCard(req.user, req.params.listId, req.body);
  res.status(201).json({ card });
});

export const updateCardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const card = await updateCard(req.user, req.params.id, req.body);
  res.json({ card });
});

export const deleteCardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  await deleteCard(req.user, req.params.id);
  res.status(204).send();
});

export const getCardHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const card = await getCard(req.user, req.params.id);
  res.json({ card });
});

export const searchCardsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация");
  }
  const { q, limit } = searchCardsQuerySchema.parse(req.query);
  const results = await searchCards(req.user, q, limit ?? 10);
  res.json({ cards: results });
});
