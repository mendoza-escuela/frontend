import axios from "axios";

const FALLBACK_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

const technicalOrEnglishMessage =
  /\b(internal server error|network error|failed|failure|invalid|expected|too small|too big|must|should|required|unrecognized|unexpected|error occurred|not found|unauthorized|forbidden|bad request|cannot|already exists|does not exist|empty|length|greater than|less than|duplicate|property .* should not exist)\b/i;

function safeMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    const messages = value
      .map(safeMessage)
      .filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(" ") : null;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const message = value.trim();
  if (/internal server error/i.test(message)) {
    return "Ocurrió un error interno. Intentá nuevamente más tarde.";
  }
  if (/network error|failed to fetch/i.test(message)) {
    return "No pudimos comunicarnos con el servidor. Revisá tu conexión e intentá nuevamente.";
  }
  if (technicalOrEnglishMessage.test(message)) return FALLBACK_MESSAGE;
  return message;
}

export function getHttpErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    if (!error.response) {
      return "No pudimos comunicarnos con el servidor. Revisá tu conexión e intentá nuevamente.";
    }
    return safeMessage(error.response.data?.message) ?? FALLBACK_MESSAGE;
  }
  return FALLBACK_MESSAGE;
}

export type HttpErrorDetails = {
  code: string | null;
  field: string | null;
  message: string;
};

export function getHttpErrorDetails(error: unknown): HttpErrorDetails | null {
  if (!axios.isAxiosError(error) || !error.response) return null;
  const payload = error.response.data;
  if (!payload || typeof payload !== "object") return null;
  const response = payload as {
    code?: unknown;
    field?: unknown;
    message?: unknown;
  };
  return {
    code: typeof response.code === "string" ? response.code : null,
    field: typeof response.field === "string" ? response.field : null,
    message: safeMessage(response.message) ?? FALLBACK_MESSAGE,
  };
}
