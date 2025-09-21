"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListHandler = exports.updateListHandler = exports.createListHandler = void 0;
const async_handler_1 = require("../../middleware/async-handler");
const http_error_1 = require("../../utils/http-error");
const list_service_1 = require("./list.service");
exports.createListHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const list = await (0, list_service_1.createList)(req.user, req.params.boardId, req.body);
    res.status(201).json({ list });
});
exports.updateListHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const list = await (0, list_service_1.updateList)(req.user, req.params.id, req.body);
    res.json({ list });
});
exports.deleteListHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    await (0, list_service_1.deleteList)(req.user, req.params.id);
    res.status(204).send();
});
//# sourceMappingURL=list.controller.js.map