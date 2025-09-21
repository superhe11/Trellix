"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCardHandler = exports.deleteCardHandler = exports.updateCardHandler = exports.createCardHandler = void 0;
const async_handler_1 = require("../../middleware/async-handler");
const http_error_1 = require("../../utils/http-error");
const card_service_1 = require("./card.service");
exports.createCardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const card = await (0, card_service_1.createCard)(req.user, req.params.listId, req.body);
    res.status(201).json({ card });
});
exports.updateCardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const card = await (0, card_service_1.updateCard)(req.user, req.params.id, req.body);
    res.json({ card });
});
exports.deleteCardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    await (0, card_service_1.deleteCard)(req.user, req.params.id);
    res.status(204).send();
});
exports.getCardHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация");
    }
    const card = await (0, card_service_1.getCard)(req.user, req.params.id);
    res.json({ card });
});
//# sourceMappingURL=card.controller.js.map