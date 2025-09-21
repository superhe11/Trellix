import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { HttpError } from "../utils/http-error";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body);
        // Prefer merging into existing object to avoid replacing property descriptors
        if (req.body && typeof req.body === "object") {
          Object.assign(req.body as any, parsedBody);
        } else {
          // Fallback if body is undefined/null
          (req as any).body = parsedBody;
        }
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as unknown as Request["query"];
        // Express 5 exposes req.query via a getter; do not reassign it
        Object.assign(req.query as any, parsedQuery as any);
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as unknown as Request["params"];
        // Avoid reassigning params; merge instead
        Object.assign(req.params as any, parsedParams as any);
      }
      next();
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }

      if (error instanceof ZodError) {
        const issue = error.issues[0];
        const message = issue?.message ?? "Ошибка валидации данных";
        return next(
          new HttpError(400, `Ошибка валидации: ${message}`, {
            code: "VALIDATION_ERROR",
            details: error.flatten(),
          })
        );
      }

      if (error instanceof Error) {
        return next(
          new HttpError(400, error.message, {
            code: "VALIDATION_ERROR",
          })
        );
      }
      next(error);
    }
  };
}
