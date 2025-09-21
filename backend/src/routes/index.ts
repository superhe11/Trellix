import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { adminUsersRouter } from "../modules/users/users.routes";
import { boardRouter } from "../modules/boards/board.routes";
import { listRouter } from "../modules/lists/list.routes";
import { cardRouter } from "../modules/cards/card.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/users", adminUsersRouter);
apiRouter.use("/boards", boardRouter);
apiRouter.use(listRouter);
apiRouter.use(cardRouter);
