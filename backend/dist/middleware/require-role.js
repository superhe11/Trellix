"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const http_error_1 = require("../utils/http-error");
function requireRole(...allowed) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new http_error_1.HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
        }
        if (!allowed.includes(req.user.role)) {
            return next(new http_error_1.HttpError(403, "Недостаточно прав", { code: "FORBIDDEN" }));
        }
        next();
    };
}
//# sourceMappingURL=require-role.js.map