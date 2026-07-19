import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "So‘rov manbasi tasdiqlanmadi");
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
