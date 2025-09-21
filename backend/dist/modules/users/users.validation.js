"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.queryUsersSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.queryUsersSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    managerId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().min(1).optional(),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    fullName: zod_1.z.string().min(2).max(120),
    role: zod_1.z.nativeEnum(client_1.UserRole),
    managerId: zod_1.z.string().uuid().nullable().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120).optional(),
    password: zod_1.z.string().min(8).max(128).optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    managerId: zod_1.z.string().uuid().nullable().optional(),
});
//# sourceMappingURL=users.validation.js.map