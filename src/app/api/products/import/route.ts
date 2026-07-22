import { z } from "zod";

import { createProductSchema, type CreateProductInput } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { importProductBatch } from "@/server/commerce-repository";
import { parseCsv } from "@/server/csv";
import { apiError, assertSameOrigin, getRequestId, HttpError } from "@/server/http";

export const dynamic = "force-dynamic";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const querySchema = z.object({
  mode: z.enum(["create", "upsert"]).default("upsert"),
  dryRun: z.enum(["true", "false"]).transform((value) => value === "true").default(true),
}).strict();

function booleanValue(value: string) {
  return ["true", "1", "yes", "ha"].includes(value.trim().toLowerCase());
}

function numberValue(value: string, fallback?: number) {
  if (!value.trim() && fallback !== undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "text/csv") {
      throw new HttpError(415, "Content-Type text/csv bo‘lishi kerak");
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMPORT_BYTES) throw new HttpError(413, "CSV hajmi 5 MB dan oshmasligi kerak");
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > MAX_IMPORT_BYTES) throw new HttpError(413, "CSV hajmi 5 MB dan oshmasligi kerak");
    const rows = parseCsv(body.replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new HttpError(422, "CSV sarlavha va kamida bitta mahsulot qatoriga ega bo‘lishi kerak", "VALIDATION_ERROR");
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const required = ["name", "sku", "category", "cost_price", "price"];
    for (const header of required) if (!headers.includes(header)) throw new HttpError(422, `${header} ustuni talab qilinadi`, "VALIDATION_ERROR");
    const index = Object.fromEntries(headers.map((header, position) => [header, position])) as Record<string, number>;
    const inputs: CreateProductInput[] = [];
    const errors: Array<{ row: number; issues: unknown }> = [];
    for (const [offset, row] of rows.slice(1).entries()) {
      const get = (name: string) => row[index[name] ?? -1] ?? "";
      const raw = {
        name: get("name"),
        sku: get("sku"),
        category: get("category"),
        costPrice: numberValue(get("cost_price")),
        price: numberValue(get("price")),
        compareAtPrice: get("compare_at_price") ? numberValue(get("compare_at_price")) : undefined,
        stock: numberValue(get("stock"), 0),
        status: get("status") || "draft",
        visibleOnStorefront: booleanValue(get("visible")),
        languages: ["UZ"],
        description: get("description") || undefined,
        image: get("image") || undefined,
        imageAlt: get("name"),
        translations: {
          UZ: {
            name: get("name"),
            description: get("description") || `${get("name")} mahsuloti`,
            imageAlt: get("name"),
            specs: [],
          },
        },
      };
      const parsed = createProductSchema.safeParse(raw);
      if (parsed.success) inputs.push(parsed.data);
      else errors.push({ row: offset + 2, issues: z.treeifyError(parsed.error) });
    }
    if (errors.length > 0) {
      throw new HttpError(422, `${errors.length} ta CSV qatorida xato bor`, "IMPORT_VALIDATION_ERROR", { rows: errors });
    }
    if (query.dryRun) return Response.json({ valid: true, rows: inputs.length, dryRun: true });
    const result = importProductBatch(inputs, query.mode, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateProducts(result.products.map((product) => product.slug));
    return Response.json({ ...result, affected: result.products.length, dryRun: false });
  } catch (error) {
    return apiError(error, request);
  }
}
