import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { HttpError } from "../utils/http-error";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
  }

  const payload = verifyAccessToken(token);
  req.user = {
    userId: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role as Express.UserPayload["role"],
  };
  req.tokenId = payload.tokenId;
  next();
}
