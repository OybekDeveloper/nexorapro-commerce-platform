import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth";
import { clearSessionCookie } from "@/server/auth";
import { deleteSession } from "@/server/auth-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) deleteSession(token);
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error, request);
  }
}
