"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardIdParamsSchema = exports.listIdParamsSchema = exports.updateListSchema = exports.createListSchema = void 0;
const zod_1 = require("zod");
exports.createListSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120),
    position: zod_1.z.number().int().nonnegative().optional(),
});
exports.updateListSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120).optional(),
    position: zod_1.z.number().int().nonnegative().optional(),
});
exports.listIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.boardIdParamsSchema = zod_1.z.object({
    boardId: zod_1.z.string().uuid(),
});
//# sourceMappingURL=list.validation.js.map