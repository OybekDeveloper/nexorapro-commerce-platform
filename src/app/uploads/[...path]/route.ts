import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

type Context = { params: Promise<{ path: string[] }> };

const uploadRoot = process.env.UPLOAD_DIR || "/tmp/nexorapro-uploads";
const filePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;
const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(request: Request, context: Context) {
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
    const stats = await fs.stat(/*turbopackIgnore: true*/ filePath);
    if (!stats.isFile()) return new Response("Not found", { status: 404 });

    const etag = `"${stats.size.toString(16)}-${Math.trunc(stats.mtimeMs).toString(16)}"`;
    const baseHeaders = {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": mimeTypes[extension],
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
      "Last-Modified": stats.mtime.toUTCString(),
    };

    // Uploaded files are immutable per URL; a matching validator means the
    // client copy is current and no body needs to leave the 1 GB VPS.
    const ifNoneMatch = request.headers.get("if-none-match");
    const ifModifiedSince = request.headers.get("if-modified-since");
    if (
      (ifNoneMatch && ifNoneMatch.split(",").some((value) => value.trim() === etag))
      || (!ifNoneMatch && ifModifiedSince && stats.mtime.getTime() <= Date.parse(ifModifiedSince))
    ) {
      return new Response(null, { status: 304, headers: baseHeaders });
    }

    // Stream from disk instead of buffering the whole file in memory.
    const stream = Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ filePath)) as ReadableStream;
    return new Response(stream, {
      headers: { ...baseHeaders, "Content-Length": String(stats.size) },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    throw error;
  }
}
