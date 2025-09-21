"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBoardMembersHandler = exports.deleteBoardHandler = exports.updateBoardHandler = exports.createBoardHandler = exports.getBoardHandler = exports.listBoardsHandler = void 0;
const async_handler_1 = require("../../middleware/async-handler");
const http_error_1 = require("../../utils/http-error");
const board_service_1 = require("./board.service");
exports.listBoardsHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const boards = await (0, board_service_1.listBoardsForUser)(req.user);
    res.json({ boards });
});
exports.getBoardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const board = await (0, board_service_1.getBoardById)(req.user, req.params.id);
    res.json({ board });
});
exports.createBoardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const board = await (0, board_service_1.createBoard)(req.user, req.body);
    res.status(201).json({ board });
});
exports.updateBoardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const board = await (0, board_service_1.updateBoard)(req.user, req.params.id, req.body);
    res.json({ board });
});
exports.deleteBoardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    await (0, board_service_1.deleteBoard)(req.user, req.params.id);
    res.status(204).send();
});
exports.updateBoardMembersHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const board = await (0, board_service_1.updateBoardMembers)(req.user, req.params.id, req.body);
    res.json({ board });
});
//# sourceMappingURL=board.controller.js.map