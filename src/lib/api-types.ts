export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorDetail = {
  path: string;
  message: string;
  code?: string;
};

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode | string;
    message: string;
    requestId: string;
    details?: ApiErrorDetail[] | Record<string, unknown>;
  };
};
