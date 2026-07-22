import "server-only";

import { randomUUID } from "node:crypto";

import { ZodError, type ZodType } from "zod";

import type { ApiErrorCode, ApiErrorDetail, ApiErrorPayload } from "@/lib/api-types";

const statusCodeMap: Record<number, ApiErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "RATE_LIMITED",
  502: "UPSTREAM_ERROR",
};
const requestIds = new WeakMap<Request, string>();
const rateLimits = new Map<string, { count: number; resetsAt: number }>();

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: ApiErrorCode | string = statusCodeMap[status] ?? "BAD_REQUEST",
    public details?: ApiErrorDetail[] | Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function getRequestId(request?: Request) {
  if (request) {
    const existing = requestIds.get(request);
    if (existing) return existing;
  }
  const supplied = request?.headers.get("x-request-id")?.trim();
  const requestId = supplied && /^[a-zA-Z0-9._:-]{8,128}$/.test(supplied) ? supplied : randomUUID();
  if (request) requestIds.set(request, requestId);
  return requestId;
}

export function getClientIp(request: Request) {
  return request.headers.get("x-real-ip")?.trim()
    || request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(request)}`;
  const current = rateLimits.get(key);
  if (!current || current.resetsAt <= now) {
    rateLimits.set(key, { count: 1, resetsAt: now + windowMs });
  } else {
    current.count += 1;
    if (current.count > limit) {
      throw new HttpError(429, "Juda ko‘p so‘rov yuborildi. Birozdan keyin qayta urinib ko‘ring", "RATE_LIMITED", {
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
      });
    }
  }
  if (rateLimits.size > 5_000) {
    for (const [entryKey, value] of rateLimits) if (value.resetsAt <= now) rateLimits.delete(entryKey);
  }
}

function errorResponse(
  status: number,
  code: ApiErrorCode | string,
  message: string,
  requestId: string,
  details?: ApiErrorDetail[] | Record<string, unknown>,
) {
  const payload: ApiErrorPayload = { error: { code, message, requestId, ...(details ? { details } : {}) } };
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new HttpError(403, "So‘rov manbasi tasdiqlanmadi");

  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const protocol = forwardedProto || requestUrl.protocol.slice(0, -1);

  let expectedOrigin = requestUrl.origin;
  if (host && (protocol === "http" || protocol === "https")) {
    try {
      expectedOrigin = new URL(`${protocol}://${host}`).origin;
    } catch {
      throw new HttpError(403, "So‘rov manbasi tasdiqlanmadi");
    }
  }

  if (origin !== expectedOrigin) throw new HttpError(403, "So‘rov manbasi tasdiqlanmadi");
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>, maxBytes = 1_048_576): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new HttpError(415, "Content-Type application/json bo‘lishi kerak");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, `So‘rov hajmi ${maxBytes} baytdan oshmasligi kerak`);
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new HttpError(413, `So‘rov hajmi ${maxBytes} baytdan oshmasligi kerak`);
  }
  if (!text.trim()) throw new HttpError(400, "JSON so‘rov tanasi bo‘sh");

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HttpError(400, "JSON formati noto‘g‘ri");
  }
  return schema.parse(value);
}

export function apiError(error: unknown, request?: Request) {
  const requestId = getRequestId(request);
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
      code: issue.code,
    }));
    return errorResponse(422, "VALIDATION_ERROR", "Kiritilgan ma’lumot noto‘g‘ri", requestId, details);
  }
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.code, error.message, requestId, error.details);
  }

  const message = error instanceof Error ? error.message : "Server xatosi";
  const conflict = /UNIQUE constraint failed/i.test(message);
  if (conflict) {
    return errorResponse(409, "CONFLICT", "Email, SKU yoki slug avvaldan mavjud", requestId);
  }

  console.error(`[${requestId}] Unhandled API error`, error);
  return errorResponse(500, "INTERNAL_ERROR", "Server xatosi", requestId);
}
