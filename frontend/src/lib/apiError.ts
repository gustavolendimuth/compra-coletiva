import axios from "axios";

type ApiErrorBody = {
  message?: string;
  details?: unknown;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

export const getApiErrorDetails = <T = unknown>(error: unknown): T | undefined => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.details as T | undefined;
  }
  return undefined;
};
