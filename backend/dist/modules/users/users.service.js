"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const http_error_1 = require("../../utils/http-error");
const password_1 = require("../../utils/password");
const baseSelect = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    managerId: true,
    createdAt: true,
    updatedAt: true,
    manager: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
    },
};
async function listUsers(filters) {
    return prisma_1.prisma.user.findMany({
        where: {
            role: filters.role,
            managerId: filters.managerId,
            OR: filters.search
                ? [
                    { email: { contains: filters.search, mode: "insensitive" } },
                    { fullName: { contains: filters.search, mode: "insensitive" } },
                ]
                : undefined,
        },
        orderBy: { fullName: "asc" },
        select: {
            ...baseSelect,
            subordinates: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
}
async function createUser(input) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw new http_error_1.HttpError(409, "Пользователь с таким email уже существует");
    }
    const managerId = input.managerId ?? null;
    if (managerId) {
        await assertManager(managerId);
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email: input.email,
            password: await (0, password_1.hashPassword)(input.password),
            fullName: input.fullName,
            role: input.role,
            managerId,
        },
        select: baseSelect,
    });
    return user;
}
async function updateUser(id, payload) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { id } });
    if (!existing) {
        throw new http_error_1.HttpError(404, "Пользователь не найден");
    }
    const data = {};
    if (payload.fullName) {
        data.fullName = payload.fullName;
    }
    if (payload.password) {
        data.password = await (0, password_1.hashPassword)(payload.password);
    }
    if (payload.role) {
        data.role = payload.role;
    }
    if (payload.managerId !== undefined) {
        if (payload.managerId) {
            await assertManager(payload.managerId);
            data.managerId = payload.managerId;
        }
        else {
            data.managerId = null;
        }
    }
    if (payload.role === client_1.UserRole.LEAD) {
        data.managerId = null;
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id },
        data,
        select: baseSelect,
    });
    return updated;
}
async function deleteUser(id) {
    await prisma_1.prisma.user.updateMany({
        where: { managerId: id },
        data: { managerId: null },
    });
    await prisma_1.prisma.refreshToken.deleteMany({ where: { userId: id } });
    await prisma_1.prisma.boardMember.deleteMany({ where: { userId: id } });
    await prisma_1.prisma.cardAssignment.deleteMany({ where: { userId: id } });
    await prisma_1.prisma.user.delete({ where: { id } });
}
async function assertManager(managerId) {
    const manager = await prisma_1.prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) {
        throw new http_error_1.HttpError(400, "Руководитель не найден");
    }
    if (manager.role !== client_1.UserRole.LEAD && manager.role !== client_1.UserRole.ADMIN) {
        throw new http_error_1.HttpError(400, "Назначить руководителем можно только пользователя с ролью LEAD или ADMIN");
    }
}
//# sourceMappingURL=users.service.js.map