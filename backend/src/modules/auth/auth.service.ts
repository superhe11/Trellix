import { prisma } from "../../prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import { HttpError } from "../../utils/http-error";
import { issueAuthTokens, rotateRefreshToken, revokeRefreshToken } from "../../utils/tokens";
import { User } from "@prisma/client";

function serializeUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

export async function registerUser(input: { email: string; password: string; fullName: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "Пользователь с таким email уже существует");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash,
      fullName: input.fullName,
    },
  });

  const tokens = await issueAuthTokens(user);
  return { user: serializeUser(user), ...tokens };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, "Неверные учетные данные");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new HttpError(401, "Неверные учетные данные");
  }

  const tokens = await issueAuthTokens(user);
  return { user: serializeUser(user), ...tokens };
}

export async function refreshSession(token: string) {
  const { user, accessToken, refreshToken } = await rotateRefreshToken(token);
  return { user: serializeUser(user), accessToken, refreshToken };
}

export async function logoutSession(token: string) {
  await revokeRefreshToken(token);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
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
    throw new HttpError(404, "Пользователь не найден");
  }
  const { password, ...rest } = user;
  return rest;
}
