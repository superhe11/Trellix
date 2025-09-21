"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const tokens_1 = require("../utils/tokens");
const http_error_1 = require("../utils/http-error");
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new http_error_1.HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
        return next(new http_error_1.HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
    }
    const payload = (0, tokens_1.verifyAccessToken)(token);
    req.user = {
        userId: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
    };
    req.tokenId = payload.tokenId;
    next();
}
//# sourceMappingURL=authenticate.js.map