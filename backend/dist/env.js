"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: zod_1.z.string().min(1),
    PORT: zod_1.z.string().default("4000"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    ACCESS_TOKEN_TTL: zod_1.z.string().default("15m"),
    REFRESH_TOKEN_TTL: zod_1.z.string().default("7d"),
    COOKIE_DOMAIN: zod_1.z.string().default("localhost"),
    COOKIE_SECURE: zod_1.z
        .union([
        zod_1.z.string().transform((value) => ["1", "true", "yes"].includes(value.toLowerCase())),
        zod_1.z.boolean(),
    ])
        .default(false),
    COOKIE_SAME_SITE: zod_1.z.enum(["lax", "strict", "none"]).default("lax"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
exports.env = {
    ...parsed.data,
    PORT: Number(parsed.data.PORT) || 4000,
    COOKIE_SECURE: Boolean(parsed.data.COOKIE_SECURE),
};
//# sourceMappingURL=env.js.map