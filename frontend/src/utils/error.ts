import { AxiosError } from "axios";
import type { ApiError } from "@/types";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Запрос содержит некорректные данные.",
  401: "Необходимо авторизоваться.",
  403: "Недостаточно прав для выполнения действия.",
  404: "Ресурс не найден или был удалён.",
  409: "Конфликт данных. Повторите попытку позже.",
  422: "Не удалось обработать данные. Проверьте введённую информацию.",
  429: "Слишком много запросов. Попробуйте позже.",
  500: "На сервере произошла ошибка. Повторите попытку позже.",
};

export function extractErrorMessage(error: unknown, fallback = "Произошла ошибка") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const axiosError = error as AxiosError<ApiError>;

  if (axiosError.code === "ERR_NETWORK") {
    return "Не удалось подключиться к серверу. Проверьте интернет-соединение.";
  }

  const payload = axiosError.response?.data;
  if (payload) {
    const rawError = payload.error;
    if (typeof rawError === "string" && rawError.trim().length > 0) {
      return rawError;
    }

    if (rawError && typeof rawError === "object") {
      const messageValue = (rawError as { message?: string }).message;
      const prepared = typeof messageValue === "string" ? messageValue.trim() : "";
      if (prepared) {
        return prepared;
      }
    }

    if (payload.message && payload.message.trim().length > 0) {
      return payload.message;
    }
  }

  const status = axiosError.response?.status;
  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return fallback;
}
