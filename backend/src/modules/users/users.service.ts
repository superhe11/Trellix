import { UserRole } from "@prisma/client";
import { prisma } from "../../prisma";
import { HttpError } from "../../utils/http-error";
import { hashPassword } from "../../utils/password";

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
} as const;

export async function listUsers(filters: { role?: UserRole; managerId?: string; search?: string }) {
  return prisma.user.findMany({
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

export async function createUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  managerId?: string | null;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "Пользователь с таким email уже существует");
  }

  const managerId = input.managerId ?? null;
  if (managerId) {
    await assertManager(managerId);
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: await hashPassword(input.password),
      fullName: input.fullName,
      role: input.role,
      managerId,
    },
    select: baseSelect,
  });

  return user;
}

export async function updateUser(
  id: string,
  payload: { fullName?: string; password?: string; role?: UserRole; managerId?: string | null }
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Пользователь не найден");
  }

  const data: Record<string, unknown> = {};

  if (payload.fullName) {
    data.fullName = payload.fullName;
  }

  if (payload.password) {
    data.password = await hashPassword(payload.password);
  }

  if (payload.role) {
    data.role = payload.role;
  }

  if (payload.managerId !== undefined) {
    if (payload.managerId) {
      await assertManager(payload.managerId);
      data.managerId = payload.managerId;
    } else {
      data.managerId = null;
    }
  }

  if (payload.role === UserRole.LEAD) {
    data.managerId = null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: baseSelect,
  });

  return updated;
}

export async function deleteUser(id: string) {
  await prisma.user.updateMany({
    where: { managerId: id },
    data: { managerId: null },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: id } });
  await prisma.boardMember.deleteMany({ where: { userId: id } });
  await prisma.cardAssignment.deleteMany({ where: { userId: id } });

  await prisma.user.delete({ where: { id } });
}

async function assertManager(managerId: string) {
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  if (!manager) {
    throw new HttpError(400, "Руководитель не найден");
  }
  if (manager.role !== UserRole.LEAD && manager.role !== UserRole.ADMIN) {
    throw new HttpError(400, "Назначить руководителем можно только пользователя с ролью LEAD или ADMIN");
  }
}

