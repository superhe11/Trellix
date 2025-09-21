import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/require-role";
import { validate } from "../../middleware/validate";
import {
  createBoardHandler,
  deleteBoardHandler,
  getBoardHandler,
  listBoardsHandler,
  updateBoardHandler,
  updateBoardMembersHandler,
} from "./board.controller";
import { boardIdParamsSchema, createBoardSchema, updateBoardMembersSchema, updateBoardSchema } from "./board.validation";

export const boardRouter = Router();

boardRouter.use(authenticate);

boardRouter.get("/", listBoardsHandler);

boardRouter.post("/", requireRole(UserRole.ADMIN, UserRole.LEAD), validate({ body: createBoardSchema }), createBoardHandler);

boardRouter.get("/:id", validate({ params: boardIdParamsSchema }), getBoardHandler);

boardRouter.patch(
  "/:id",
  validate({ params: boardIdParamsSchema, body: updateBoardSchema }),
  updateBoardHandler
);

boardRouter.delete("/:id", validate({ params: boardIdParamsSchema }), deleteBoardHandler);

boardRouter.put(
  "/:id/members",
  validate({ params: boardIdParamsSchema, body: updateBoardMembersSchema }),
  updateBoardMembersHandler
);
