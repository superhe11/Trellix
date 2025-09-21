"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueAuthTokens = issueAuthTokens;
exports.verifyAccessToken = verifyAccessToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
const node_crypto_1 = __importDefault(require("node:crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const date_fns_1 = require("date-fns");
const env_1 = require("../env");
const prisma_1 = require("../prisma");
const http_error_1 = require("./http-error");
async function issueAuthTokens(user) {
    const refreshId = node_crypto_1.default.randomUUID();
    const expiresAt = (0, date_fns_1.add)(new Date(), parseDuration(env_1.env.REFRESH_TOKEN_TTL));
    const refreshSecret = env_1.env.JWT_REFRESH_SECRET;
    const refreshOptions = { expiresIn: env_1.env.REFRESH_TOKEN_TTL };
    const refreshToken = jsonwebtoken_1.default.sign({
        sub: user.id,
        tokenId: refreshId,
        type: "refresh",
    }, refreshSecret, refreshOptions);
    await prisma_1.prisma.refreshToken.create({
        data: {
            id: refreshId,
            token: refreshToken,
            userId: user.id,
            expiresAt,
        },
    });
    const accessSecret = env_1.env.JWT_ACCESS_SECRET;
    const accessOptions = { expiresIn: env_1.env.ACCESS_TOKEN_TTL };
    const accessToken = jsonwebtoken_1.default.sign({
        sub: user.id,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        tokenId: refreshId,
        type: "access",
    }, accessSecret, accessOptions);
    return { accessToken, refreshToken, refreshId };
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
    }
    catch (error) {
        throw new http_error_1.HttpError(401, "Недействительный токен доступа", { code: "TOKEN_INVALID", details: error });
    }
}
async function rotateRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
        if (decoded.type !== "refresh") {
            throw new http_error_1.HttpError(401, "Некорректный тип токена", { code: "TOKEN_INVALID_TYPE" });
        }
        const stored = await prisma_1.prisma.refreshToken.findUnique({
            where: { token },
        });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            throw new http_error_1.HttpError(401, "Refresh токен отозван или истёк", { code: "TOKEN_REVOKED" });
        }
        const user = await prisma_1.prisma.user.findUniqueOrThrow({ where: { id: decoded.sub } });
        const next = await issueAuthTokens(user);
        await prisma_1.prisma.refreshToken.update({
            where: { token },
            data: {
                revoked: true,
                replacedById: next.refreshId,
            },
        });
        return { user, ...next };
    }
    catch (error) {
        if (error instanceof http_error_1.HttpError) {
            throw error;
        }
        throw new http_error_1.HttpError(401, "Недействительный refresh токен", { code: "REFRESH_TOKEN_INVALID", details: error });
    }
}
async function revokeRefreshToken(token) {
    await prisma_1.prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
    });
}
function parseDuration(duration) {
    const match = /^([0-9]+)([a-z]+)$/i.exec(duration.trim());
    if (!match) {
        throw new Error(`Неверный формат TTL: ${duration}`);
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case "s":
            return { seconds: value };
        case "m":
            return { minutes: value };
        case "h":
            return { hours: value };
        case "d":
            return { days: value };
        default:
            throw new Error(`Неизвестная единица времени: ${unit}`);
    }
}
//# sourceMappingURL=tokens.js.map