"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardIdParamsSchema = exports.updateBoardMembersSchema = exports.updateBoardSchema = exports.createBoardSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createBoardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(150),
    description: zod_1.z.string().max(500).optional(),
    ownerId: zod_1.z.string().uuid().optional(),
    memberIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.updateBoardSchema = exports.createBoardSchema.partial();
exports.updateBoardMembersSchema = zod_1.z.object({
    members: zod_1.z
        .array(zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        role: zod_1.z.nativeEnum(client_1.BoardRole).optional(),
        canManageCards: zod_1.z.boolean().optional(),
    }))
        .min(1),
});
exports.boardIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
//# sourceMappingURL=board.validation.js.map