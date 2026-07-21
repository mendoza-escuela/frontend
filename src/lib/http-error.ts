import axios from 'axios';

export function getHttpErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'No pudimos completar la operación.';
  }
  return 'No pudimos completar la operación.';
}
