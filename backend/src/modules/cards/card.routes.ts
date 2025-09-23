import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  cardIdParamsSchema,
  createCardSchema,
  listIdParamsSchema,
  updateCardSchema,
} from "./card.validation";
import {
  createCardHandler,
  deleteCardHandler,
  getCardHandler,
  updateCardHandler,
  searchCardsHandler,
} from "./card.controller";

export const cardRouter = Router();

cardRouter.use(authenticate);

cardRouter.post(
  "/lists/:listId/cards",
  validate({ params: listIdParamsSchema, body: createCardSchema }),
  createCardHandler
);

cardRouter.get("/cards/:id", validate({ params: cardIdParamsSchema }), getCardHandler);

cardRouter.get("/cards", searchCardsHandler);

cardRouter.patch(
  "/cards/:id",
  validate({ params: cardIdParamsSchema, body: updateCardSchema }),
  updateCardHandler
);

cardRouter.delete("/cards/:id", validate({ params: cardIdParamsSchema }), deleteCardHandler);
