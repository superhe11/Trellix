"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const validate_1 = require("../../middleware/validate");
const card_validation_1 = require("./card.validation");
const card_controller_1 = require("./card.controller");
exports.cardRouter = (0, express_1.Router)();
exports.cardRouter.use(authenticate_1.authenticate);
exports.cardRouter.post("/lists/:listId/cards", (0, validate_1.validate)({ params: card_validation_1.listIdParamsSchema, body: card_validation_1.createCardSchema }), card_controller_1.createCardHandler);
exports.cardRouter.get("/cards/:id", (0, validate_1.validate)({ params: card_validation_1.cardIdParamsSchema }), card_controller_1.getCardHandler);
exports.cardRouter.patch("/cards/:id", (0, validate_1.validate)({ params: card_validation_1.cardIdParamsSchema, body: card_validation_1.updateCardSchema }), card_controller_1.updateCardHandler);
exports.cardRouter.delete("/cards/:id", (0, validate_1.validate)({ params: card_validation_1.cardIdParamsSchema }), card_controller_1.deleteCardHandler);
//# sourceMappingURL=card.routes.js.map