"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meHandler = exports.logoutHandler = exports.refreshHandler = exports.loginHandler = exports.registerHandler = void 0;
const async_handler_1 = require("../../middleware/async-handler");
const http_error_1 = require("../../utils/http-error");
const time_1 = require("../../utils/time");
const env_1 = require("../../env");
const auth_service_1 = require("./auth.service");
const REFRESH_COOKIE = "trellix_refresh_token";
const refreshCookieOptions = {
    httpOnly: true,
    sameSite: env_1.env.COOKIE_SAME_SITE,
    secure: env_1.env.COOKIE_SECURE,
    domain: env_1.env.COOKIE_DOMAIN,
    path: "/",
    maxAge: (0, time_1.durationToMs)(env_1.env.REFRESH_TOKEN_TTL),
};
function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE, {
        domain: env_1.env.COOKIE_DOMAIN,
        path: "/",
        sameSite: env_1.env.COOKIE_SAME_SITE,
        secure: env_1.env.COOKIE_SECURE,
    });
}
exports.registerHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { user, accessToken, refreshToken } = await (0, auth_service_1.registerUser)(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
});
exports.loginHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { user, accessToken, refreshToken } = await (0, auth_service_1.loginUser)(req.body.email, req.body.password);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
});
exports.refreshHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE];
    const tokenFromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
    const token = tokenFromCookie ?? tokenFromBody;
    if (!token) {
        throw new http_error_1.HttpError(401, "Refresh токен отсутствует", { code: "REFRESH_TOKEN_REQUIRED" });
    }
    const { user, accessToken, refreshToken } = await (0, auth_service_1.refreshSession)(token);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
});
exports.logoutHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    if (token) {
        await (0, auth_service_1.logoutSession)(token);
    }
    clearRefreshCookie(res);
    res.status(204).send();
});
exports.meHandler = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new http_error_1.HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" });
    }
    const profile = await (0, auth_service_1.getProfile)(req.user.userId);
    res.json({ user: profile });
});
//# sourceMappingURL=auth.controller.js.map