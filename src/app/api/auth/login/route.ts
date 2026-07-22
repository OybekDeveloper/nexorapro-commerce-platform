import { loginSchema } from "@/lib/auth";
import { setSessionCookie } from "@/server/auth";
import { authenticateUser, clearLoginFailures, createSession, getLoginLock, recordLoginFailure } from "@/server/auth-repository";
import { apiError, assertSameOrigin, enforceRateLimit, getClientIp, HttpError, parseJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "customer-login", 20, 15 * 60_000);
    const input = await parseJsonBody(request, loginSchema, 16_384);
    const attemptKey = `${input.email}#${getClientIp(request)}`;
    if (getLoginLock(attemptKey)) throw new HttpError(429, "Ko‘p urinish bo‘ldi. 15 daqiqadan keyin qayta urinib ko‘ring");
    const user = authenticateUser(input.email, input.password, "customer");
    if (!user) {
      recordLoginFailure(attemptKey);
      throw new HttpError(401, "Email yoki parol noto‘g‘ri");
    }
    clearLoginFailures(attemptKey);
    const session = createSession(user.id, { userAgent: request.headers.get("user-agent"), ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() });
    await setSessionCookie(session.token, session.expiresAt);
    return Response.json({ user });
  } catch (error) {
    return apiError(error, request);
  }
}
