"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const validate_1 = require("../../middleware/validate");
const list_validation_1 = require("./list.validation");
const list_controller_1 = require("./list.controller");
exports.listRouter = (0, express_1.Router)();
exports.listRouter.use(authenticate_1.authenticate);
exports.listRouter.post("/boards/:boardId/lists", (0, validate_1.validate)({ params: list_validation_1.boardIdParamsSchema, body: list_validation_1.createListSchema }), list_controller_1.createListHandler);
exports.listRouter.patch("/lists/:id", (0, validate_1.validate)({ params: list_validation_1.listIdParamsSchema, body: list_validation_1.updateListSchema }), list_controller_1.updateListHandler);
exports.listRouter.delete("/lists/:id", (0, validate_1.validate)({ params: list_validation_1.listIdParamsSchema }), list_controller_1.deleteListHandler);
//# sourceMappingURL=list.routes.js.map