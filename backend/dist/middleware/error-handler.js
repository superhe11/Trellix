"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const http_error_1 = require("../utils/http-error");
function errorHandler(err, _req, res, _next) {
    if (err instanceof http_error_1.HttpError) {
        return res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
    }
    console.error("Unhandled error", err);
    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Внутренняя ошибка сервера. Повторите попытку позже.",
        },
    });
}
//# sourceMappingURL=error-handler.js.map