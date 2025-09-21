import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  boardIdParamsSchema,
  createListSchema,
  listIdParamsSchema,
  updateListSchema,
} from "./list.validation";
import { createListHandler, deleteListHandler, updateListHandler } from "./list.controller";

export const listRouter = Router();

listRouter.use(authenticate);

listRouter.post(
  "/boards/:boardId/lists",
  validate({ params: boardIdParamsSchema, body: createListSchema }),
  createListHandler
);

listRouter.patch(
  "/lists/:id",
  validate({ params: listIdParamsSchema, body: updateListSchema }),
  updateListHandler
);

listRouter.delete(
  "/lists/:id",
  validate({ params: listIdParamsSchema }),
  deleteListHandler
);
