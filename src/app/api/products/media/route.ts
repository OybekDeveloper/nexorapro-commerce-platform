import { z } from "zod";

import { requireApiUser } from "@/server/auth";
import { apiError, assertSameOrigin, HttpError } from "@/server/http";
import { MAX_PRODUCT_UPLOAD_BYTES, saveProductImage } from "@/server/uploads";

export const dynamic = "force-dynamic";

const fieldsSchema = z.object({
  altText: z.string().trim().max(180).default(""),
  isPrimary: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("multipart/form-data;")) {
      throw new HttpError(415, "Content-Type multipart/form-data bo‘lishi kerak");
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PRODUCT_UPLOAD_BYTES + 65_536) {
      throw new HttpError(413, "Upload hajmi 8 MB dan oshmasligi kerak");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(422, "file maydoni talab qilinadi", "VALIDATION_ERROR");
    const fields = fieldsSchema.parse({
      altText: form.get("altText") ?? "",
      isPrimary: form.get("isPrimary") ?? "false",
    });
    const saved = await saveProductImage(file);
    return Response.json({
      media: {
        type: "image" as const,
        ...saved,
        altText: fields.altText,
        position: 0,
        isPrimary: fields.isPrimary,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
