import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

const uploadRoot = process.env.UPLOAD_DIR || "/tmp/nexorapro-uploads";
const filePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;
const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(_request: Request, context: Context) {
  const segments = (await context.params).path;
  if (
    segments.length !== 4
    || segments[0] !== "products"
    || !/^\d{4}$/.test(segments[1])
    || !/^(?:0[1-9]|1[0-2])$/.test(segments[2])
    || !filePattern.test(segments[3])
  ) {
    return new Response("Not found", { status: 404 });
  }

  const extension = segments[3].split(".").at(-1)?.toLowerCase();
  if (!extension || !mimeTypes[extension]) return new Response("Not found", { status: 404 });

  try {
    const filePath = path.join(/*turbopackIgnore: true*/ uploadRoot, ...segments);
    const file = await fs.readFile(/*turbopackIgnore: true*/ filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": mimeTypes[extension],
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    throw error;
  }
}
