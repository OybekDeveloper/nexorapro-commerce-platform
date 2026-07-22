import { registerSchema } from "@/lib/auth";
import { setSessionCookie } from "@/server/auth";
import { createCustomer, createSession } from "@/server/auth-repository";
import { apiError, assertSameOrigin, enforceRateLimit, parseJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "register", 5, 60 * 60_000);
    const input = await parseJsonBody(request, registerSchema, 16_384);
    const user = createCustomer(input.name, input.email, input.password);
    const session = createSession(user.id, { userAgent: request.headers.get("user-agent"), ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() });
    await setSessionCookie(session.token, session.expiresAt);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
