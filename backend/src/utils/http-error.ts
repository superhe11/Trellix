const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_ERROR",
};

export interface HttpErrorOptions {
  code?: string;
  details?: unknown;
}

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, optionsOrDetails?: HttpErrorOptions | unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;

    if (isHttpErrorOptions(optionsOrDetails)) {
      this.code = optionsOrDetails.code ?? defaultCode(status);
      this.details = optionsOrDetails.details;
    } else {
      this.code = defaultCode(status);
      if (optionsOrDetails !== undefined) {
        this.details = optionsOrDetails;
      }
    }
  }
}

export function assert(
  condition: unknown,
  status: number,
  message: string,
  options?: HttpErrorOptions
): asserts condition {
  if (!condition) {
    throw new HttpError(status, message, options);
  }
}

function defaultCode(status: number) {
  return STATUS_CODE_MAP[status] ?? `ERROR_${status}`;
}

function isHttpErrorOptions(value: unknown): value is HttpErrorOptions {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as HttpErrorOptions;
  return "code" in candidate || "details" in candidate;
}
