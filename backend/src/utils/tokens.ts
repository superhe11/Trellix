import crypto from "node:crypto";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { add } from "date-fns";
import { User } from "@prisma/client";
import { env } from "../env";
import { prisma } from "../prisma";
import { HttpError } from "./http-error";

interface TokenPayload {
  sub: string;
  role: string;
  email: string;
  fullName: string;
  tokenId: string;
  type: "access";
}

export async function issueAuthTokens(user: User) {
  const refreshId = crypto.randomUUID();
  const expiresAt = add(new Date(), parseDuration(env.REFRESH_TOKEN_TTL));

  const refreshSecret: Secret = env.JWT_REFRESH_SECRET;
  const refreshOptions: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] };

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      tokenId: refreshId,
      type: "refresh",
    },
    refreshSecret,
    refreshOptions
  );

  await prisma.refreshToken.create({
    data: {
      id: refreshId,
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  const accessSecret: Secret = env.JWT_ACCESS_SECRET;
  const accessOptions: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] };

  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      tokenId: refreshId,
      type: "access",
    } satisfies TokenPayload,
    accessSecret,
    accessOptions
  );

  return { accessToken, refreshToken, refreshId };
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload & { iat: number; exp: number };
  } catch (error) {
    throw new HttpError(401, "Недействительный токен доступа", { code: "TOKEN_INVALID", details: error });
  }
}

export async function rotateRefreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      sub: string;
      tokenId: string;
      type: "refresh";
      iat: number;
      exp: number;
    };

    if (decoded.type !== "refresh") {
      throw new HttpError(401, "Некорректный тип токена", { code: "TOKEN_INVALID_TYPE" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new HttpError(401, "Refresh токен отозван или истёк", { code: "TOKEN_REVOKED" });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: decoded.sub } });

    const next = await issueAuthTokens(user);

    await prisma.refreshToken.update({
      where: { token },
      data: {
        revoked: true,
        replacedById: next.refreshId,
      },
    });

    return { user, ...next };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "Недействительный refresh токен", { code: "REFRESH_TOKEN_INVALID", details: error });
  }
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
}

function parseDuration(duration: string) {
  const match = /^([0-9]+)([a-z]+)$/i.exec(duration.trim());
  if (!match) {
    throw new Error(`Неверный формат TTL: ${duration}`);
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return { seconds: value } as const;
    case "m":
      return { minutes: value } as const;
    case "h":
      return { hours: value } as const;
    case "d":
      return { days: value } as const;
    default:
      throw new Error(`Неизвестная единица времени: ${unit}`);
  }
}
