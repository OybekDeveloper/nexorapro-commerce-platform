import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: "Kiritilgan ma’lumot noto‘g‘ri", issues: error.issues }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "Server xatosi";
  const conflict = /UNIQUE constraint failed/.test(message);
  return Response.json({ error: conflict ? "SKU yoki slug avvaldan mavjud" : message }, { status: conflict ? 409 : 400 });
}
