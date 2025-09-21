"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../../middleware/authenticate");
const validate_1 = require("../../middleware/validate");
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", (0, validate_1.validate)({ body: auth_validation_1.registerSchema }), auth_controller_1.registerHandler);
exports.authRouter.post("/login", (0, validate_1.validate)({ body: auth_validation_1.loginSchema }), auth_controller_1.loginHandler);
exports.authRouter.post("/refresh", auth_controller_1.refreshHandler);
exports.authRouter.post("/logout", auth_controller_1.logoutHandler);
exports.authRouter.get("/me", authenticate_1.authenticate, auth_controller_1.meHandler);
//# sourceMappingURL=auth.routes.js.map