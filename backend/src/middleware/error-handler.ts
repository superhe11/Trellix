import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error("Unhandled error", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Внутренняя ошибка сервера. Повторите попытку позже.",
    },
  });
}
