"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserHandler = exports.updateUserHandler = exports.createUserHandler = exports.listUsersHandler = void 0;
const async_handler_1 = require("../../middleware/async-handler");
const http_error_1 = require("../../utils/http-error");
const users_service_1 = require("./users.service");
exports.listUsersHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const users = await (0, users_service_1.listUsers)(req.query);
    res.json({ users });
});
exports.createUserHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = await (0, users_service_1.createUser)(req.body);
    res.status(201).json({ user });
});
exports.updateUserHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new http_error_1.HttpError(400, "ID пользователя обязателен");
    }
    const user = await (0, users_service_1.updateUser)(id, req.body);
    res.json({ user });
});
exports.deleteUserHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new http_error_1.HttpError(400, "ID пользователя обязателен");
    }
    await (0, users_service_1.deleteUser)(id);
    res.status(204).send();
});
//# sourceMappingURL=users.controller.js.map