"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIdParamsSchema = exports.cardIdParamsSchema = exports.updateCardSchema = exports.createCardSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createCardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    position: zod_1.z.number().int().nonnegative().optional(),
    assigneeIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
});
exports.updateCardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).nullable().optional(),
    status: zod_1.z.nativeEnum(client_1.CardStatus).optional(),
    position: zod_1.z.number().int().nonnegative().optional(),
    listId: zod_1.z.string().uuid().optional(),
    assigneeIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    dueDate: zod_1.z.string().datetime().nullable().optional(),
    archived: zod_1.z.boolean().optional(),
});
exports.cardIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.listIdParamsSchema = zod_1.z.object({
    listId: zod_1.z.string().uuid(),
});
//# sourceMappingURL=card.validation.js.map