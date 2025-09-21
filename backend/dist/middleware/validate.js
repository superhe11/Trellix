"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const http_error_1 = require("../utils/http-error");
function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof http_error_1.HttpError) {
                return next(error);
            }
            if (error instanceof zod_1.ZodError) {
                const issue = error.issues[0];
                const message = issue?.message ?? "Ошибка валидации данных";
                return next(new http_error_1.HttpError(400, `Ошибка валидации: ${message}`, {
                    code: "VALIDATION_ERROR",
                    details: error.flatten(),
                }));
            }
            if (error instanceof Error) {
                return next(new http_error_1.HttpError(400, error.message, {
                    code: "VALIDATION_ERROR",
                }));
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.js.map