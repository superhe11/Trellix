"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_routes_1 = require("../modules/auth/auth.routes");
const users_routes_1 = require("../modules/users/users.routes");
const board_routes_1 = require("../modules/boards/board.routes");
const list_routes_1 = require("../modules/lists/list.routes");
const card_routes_1 = require("../modules/cards/card.routes");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.use("/auth", auth_routes_1.authRouter);
exports.apiRouter.use("/admin/users", users_routes_1.adminUsersRouter);
exports.apiRouter.use("/boards", board_routes_1.boardRouter);
exports.apiRouter.use(list_routes_1.listRouter);
exports.apiRouter.use(card_routes_1.cardRouter);
//# sourceMappingURL=index.js.map