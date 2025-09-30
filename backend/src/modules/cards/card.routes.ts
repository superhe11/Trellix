import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  cardIdParamsSchema,
  createCardSchema,
  listIdParamsSchema,
  updateCardSchema,
  attachTagSchema,
  reorderCardTagsSchema,
  toggleFavoriteTagSchema,
  tagIdParamsSchema,
} from "./card.validation";
import {
  createCardHandler,
  deleteCardHandler,
  getCardHandler,
  updateCardHandler,
  searchCardsHandler,
  attachTagHandler,
  detachTagHandler,
  reorderTagsHandler,
  toggleFavoriteTagHandler,
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

// Card tags operations
cardRouter.post(
  "/cards/:id/tags",
  validate({ params: cardIdParamsSchema, body: attachTagSchema }),
  attachTagHandler
);

cardRouter.delete(
  "/cards/:id/tags/:tagId",
  validate({ params: tagIdParamsSchema }),
  detachTagHandler
);

cardRouter.patch(
  "/cards/:id/tags/reorder",
  validate({ params: cardIdParamsSchema, body: reorderCardTagsSchema }),
  reorderTagsHandler
);

cardRouter.patch(
  "/cards/:id/tags/:tagId/favorite",
  validate({ params: tagIdParamsSchema, body: toggleFavoriteTagSchema }),
  toggleFavoriteTagHandler
);
