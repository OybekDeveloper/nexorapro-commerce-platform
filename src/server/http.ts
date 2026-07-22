import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function assertSameOrigin(request: Request) {
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

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: "Kiritilgan ma’lumot noto‘g‘ri", issues: error.issues }, { status: 400 });
  }
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Server xatosi";
  const conflict = /UNIQUE constraint failed/.test(message);
  return Response.json({ error: conflict ? "Email, SKU yoki slug avvaldan mavjud" : message }, { status: conflict ? 409 : 400 });
}
