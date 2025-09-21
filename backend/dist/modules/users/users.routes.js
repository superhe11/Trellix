"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const authenticate_1 = require("../../middleware/authenticate");
const require_role_1 = require("../../middleware/require-role");
const validate_1 = require("../../middleware/validate");
const users_controller_1 = require("./users.controller");
const users_validation_1 = require("./users.validation");
exports.adminUsersRouter = (0, express_1.Router)();
exports.adminUsersRouter.use(authenticate_1.authenticate, (0, require_role_1.requireRole)(client_1.UserRole.ADMIN));
exports.adminUsersRouter.get("/", (0, validate_1.validate)({ query: users_validation_1.queryUsersSchema.partial() }), users_controller_1.listUsersHandler);
exports.adminUsersRouter.post("/", (0, validate_1.validate)({ body: users_validation_1.createUserSchema }), users_controller_1.createUserHandler);
exports.adminUsersRouter.patch("/:id", (0, validate_1.validate)({ body: users_validation_1.updateUserSchema }), users_controller_1.updateUserHandler);
exports.adminUsersRouter.delete("/:id", users_controller_1.deleteUserHandler);
//# sourceMappingURL=users.routes.js.map