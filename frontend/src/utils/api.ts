export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export const unwrapApiData = <T>(response: ApiResponse<T> | T): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    ("success" in response || "message" in response)
  ) {
    return (response as ApiResponse<T>).data as T;
  }

  return response as T;
};

export const toArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    "rows" in value &&
    Array.isArray((value as { rows?: unknown }).rows)
  ) {
    return (value as { rows: T[] }).rows;
  }

  return [];
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
};
