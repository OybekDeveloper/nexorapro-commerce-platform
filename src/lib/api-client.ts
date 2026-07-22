import type { ApiErrorPayload } from "@/lib/api-types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public requestId?: string,
    public details?: ApiErrorPayload["error"]["details"],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(hasBody && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({})) as Partial<ApiErrorPayload> & T & { error?: ApiErrorPayload["error"] | string };
  if (!response.ok) {
    const error = typeof payload.error === "object" && payload.error !== null ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? (typeof payload.error === "string" ? payload.error : "So‘rov bajarilmadi"),
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.requestId ?? response.headers.get("x-request-id") ?? undefined,
      error?.details,
    );
  }
  return payload;
}
