import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { HttpError } from "../utils/http-error";

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" }));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, "Недостаточно прав", { code: "FORBIDDEN" }));
    }
    next();
  };
}
