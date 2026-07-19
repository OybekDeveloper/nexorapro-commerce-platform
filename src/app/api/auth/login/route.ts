import { loginSchema } from "@/lib/auth";
import { setSessionCookie } from "@/server/auth";
import { authenticateUser, clearLoginFailures, createSession, getLoginLock, recordLoginFailure } from "@/server/auth-repository";
import { apiError, assertSameOrigin, HttpError } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = loginSchema.parse(await request.json());
    if (getLoginLock(input.email)) throw new HttpError(429, "Ko‘p urinish bo‘ldi. 15 daqiqadan keyin qayta urinib ko‘ring");
    const user = authenticateUser(input.email, input.password, "customer");
    if (!user) {
      recordLoginFailure(input.email);
      throw new HttpError(401, "Email yoki parol noto‘g‘ri");
    }
    clearLoginFailures(input.email);
    const session = createSession(user.id, { userAgent: request.headers.get("user-agent"), ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() });
    await setSessionCookie(session.token, session.expiresAt);
    return Response.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
