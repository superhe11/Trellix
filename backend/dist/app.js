"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./env");
const routes_1 = require("./routes");
const error_handler_1 = require("./middleware/error-handler");
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: (_, callback) => callback(null, true),
    credentials: true,
}));
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, morgan_1.default)(env_1.env.NODE_ENV === "development" ? "dev" : "tiny"));
exports.app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
exports.app.use("/api/v1", routes_1.apiRouter);
exports.app.use(error_handler_1.errorHandler);
//# sourceMappingURL=app.js.map