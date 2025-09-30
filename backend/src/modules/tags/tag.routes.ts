import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { boardIdParamsSchema, createTagSchema } from "./tag.validation";
import { createTagHandler, listBoardTagsHandler } from "./tag.controller";

export const tagRouter = Router();

tagRouter.use(authenticate);

tagRouter.get(
  "/boards/:boardId/tags",
  validate({ params: boardIdParamsSchema }),
  listBoardTagsHandler
);

tagRouter.post(
  "/boards/:boardId/tags",
  validate({ params: boardIdParamsSchema, body: createTagSchema }),
  createTagHandler
);

