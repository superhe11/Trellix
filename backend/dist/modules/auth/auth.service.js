"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshSession = refreshSession;
exports.logoutSession = logoutSession;
exports.getProfile = getProfile;
const prisma_1 = require("../../prisma");
const password_1 = require("../../utils/password");
const http_error_1 = require("../../utils/http-error");
const tokens_1 = require("../../utils/tokens");
function serializeUser(user) {
    const { password, ...rest } = user;
    return rest;
}
async function registerUser(input) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw new http_error_1.HttpError(409, "Пользователь с таким email уже существует");
    }
    const passwordHash = await (0, password_1.hashPassword)(input.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: input.email,
            password: passwordHash,
            fullName: input.fullName,
        },
    });
    const tokens = await (0, tokens_1.issueAuthTokens)(user);
    return { user: serializeUser(user), ...tokens };
}
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new http_error_1.HttpError(401, "Неверные учетные данные");
    }
    const valid = await (0, password_1.verifyPassword)(password, user.password);
    if (!valid) {
        throw new http_error_1.HttpError(401, "Неверные учетные данные");
    }
    const tokens = await (0, tokens_1.issueAuthTokens)(user);
    return { user: serializeUser(user), ...tokens };
}
async function refreshSession(token) {
    const { user, accessToken, refreshToken } = await (0, tokens_1.rotateRefreshToken)(token);
    return { user: serializeUser(user), accessToken, refreshToken };
}
async function logoutSession(token) {
    await (0, tokens_1.revokeRefreshToken)(token);
}
async function getProfile(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            manager: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
    if (!user) {
        throw new http_error_1.HttpError(404, "Пользователь не найден");
    }
    const { password, ...rest } = user;
    return rest;
}
//# sourceMappingURL=auth.service.js.map