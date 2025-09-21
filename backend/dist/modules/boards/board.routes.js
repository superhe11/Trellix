"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authenticate_1 = require("../../middleware/authenticate");
const require_role_1 = require("../../middleware/require-role");
const validate_1 = require("../../middleware/validate");
const board_controller_1 = require("./board.controller");
const board_validation_1 = require("./board.validation");
exports.boardRouter = (0, express_1.Router)();
exports.boardRouter.use(authenticate_1.authenticate);
exports.boardRouter.get("/", board_controller_1.listBoardsHandler);
exports.boardRouter.post("/", (0, require_role_1.requireRole)(client_1.UserRole.ADMIN, client_1.UserRole.LEAD), (0, validate_1.validate)({ body: board_validation_1.createBoardSchema }), board_controller_1.createBoardHandler);
exports.boardRouter.get("/:id", (0, validate_1.validate)({ params: board_validation_1.boardIdParamsSchema }), board_controller_1.getBoardHandler);
exports.boardRouter.patch("/:id", (0, validate_1.validate)({ params: board_validation_1.boardIdParamsSchema, body: board_validation_1.updateBoardSchema }), board_controller_1.updateBoardHandler);
exports.boardRouter.delete("/:id", (0, validate_1.validate)({ params: board_validation_1.boardIdParamsSchema }), board_controller_1.deleteBoardHandler);
exports.boardRouter.put("/:id/members", (0, validate_1.validate)({ params: board_validation_1.boardIdParamsSchema, body: board_validation_1.updateBoardMembersSchema }), board_controller_1.updateBoardMembersHandler);
//# sourceMappingURL=board.routes.js.map