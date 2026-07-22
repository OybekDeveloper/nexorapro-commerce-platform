import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(url, process) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`Test server exited with ${process.exitCode}`);
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Test server did not become ready");
}

test("commerce API critical flows", { timeout: 60_000 }, async (context) => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "nexorapro-api-test-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: baseUrl,
      NEXORAPRO_DB_PATH: path.join(temporaryDirectory, "commerce.db"),
      UPLOAD_DIR: path.join(temporaryDirectory, "uploads"),
      ADMIN_NAME: "Integration Admin",
      ADMIN_EMAIL: "integration@nexorapro.uz",
      ADMIN_PASSWORD: "Integration-Test-Password-2026!",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  context.after(async () => {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  try {
    await waitForServer(baseUrl, server);
  } catch (error) {
    throw new Error(`${error.message}\n${output}`);
  }

  const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
  assert.equal(health.schema.version, 4);
  assert.equal(health.schema.count, 3);
  const migrationBackups = await fs.readdir(path.join(temporaryDirectory, "migration-backups"));
  assert.ok(migrationBackups.some((filename) => filename.endsWith(".db")));

  const anonymous = await fetch(`${baseUrl}/api/products?pageSize=100`);
  assert.equal(anonymous.status, 401);
  const anonymousPayload = await anonymous.json();
  assert.equal(anonymousPayload.error.code, "UNAUTHORIZED");
  assert.ok(anonymousPayload.error.requestId);

  const login = await fetch(`${baseUrl}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email: "integration@nexorapro.uz", password: "Integration-Test-Password-2026!" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);

  const request = async (pathname, init = {}) => fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      Origin: baseUrl,
      Cookie: cookie,
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const invalidJson = await request("/api/products", { method: "POST", body: "{" });
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).error.code, "BAD_REQUEST");

  const uploadForm = new FormData();
  uploadForm.set("file", new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "product.png", { type: "image/png" }));
  uploadForm.set("altText", "Integration product");
  uploadForm.set("isPrimary", "true");
  const upload = await request("/api/products/media", { method: "POST", body: uploadForm });
  assert.equal(upload.status, 201);
  const uploadedMedia = (await upload.json()).media;
  assert.match(uploadedMedia.url, /^\/uploads\/products\//);
  assert.equal(uploadedMedia.mimeType, "image/png");

  const create = await request("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Integration Phone",
      sku: "INT-PHONE",
      category: "Smartfon",
      costPrice: 700,
      price: 1000,
      stock: 0,
      status: "published",
      visibleOnStorefront: true,
      languages: ["UZ"],
      translations: { UZ: { name: "Integration Phone", description: "Integration mahsuloti", imageAlt: "Integration Phone", specs: ["128GB"] } },
      variants: [
        { title: "Black / 128GB", sku: "INT-PHONE-BLK-128", costPrice: 700, price: 1000, stock: 7, status: "active", options: { Rang: "Black", Xotira: "128GB" }, position: 0 },
      ],
      media: [uploadedMedia],
    }),
  });
  assert.equal(create.status, 201);
  const product = (await create.json()).product;
  assert.equal(product.stock, 7);
  assert.equal(product.variants.length, 1);
  assert.equal(product.media.length, 1);

  const publicCatalog = await fetch(`${baseUrl}/api/products?scope=storefront`).then((response) => response.json());
  const publicProduct = publicCatalog.products.find((item) => item.id === product.id);
  assert.ok(publicProduct);
  assert.equal("costPrice" in publicProduct, false);
  assert.equal("version" in publicProduct, false);
  assert.equal("media" in publicProduct, false);
  assert.equal("costPrice" in publicProduct.variants[0], false);

  const list = await request("/api/products?page=1&pageSize=10&query=INT-PHONE&sort=sku&direction=asc");
  assert.equal(list.status, 200);
  const listPayload = await list.json();
  assert.equal(listPayload.pagination.total, 1);
  assert.equal(listPayload.products[0].id, product.id);

  const staleUpdate = await request(`/api/products/${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ price: 1100, version: product.version + 10 }),
  });
  assert.equal(staleUpdate.status, 409);
  assert.equal((await staleUpdate.json()).error.code, "VERSION_CONFLICT");

  const reservation = await request("/api/inventory/reservations", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, variantId: product.variants[0].id, quantity: 2, referenceType: "test", referenceId: "reservation-1" }),
  });
  assert.equal(reservation.status, 201);
  const reservedProduct = await request(`/api/products/${product.id}`).then((response) => response.json());
  assert.equal(reservedProduct.product.reservedStock, 2);
  assert.equal(reservedProduct.product.availableStock, 5);
  assert.equal(reservedProduct.product.variants[0].availableStock, 5);

  const missingVariantOrder = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ customer: "Integration Buyer", channel: "POS", payment: "card", discount: 0, items: [{ productId: product.id, quantity: 1 }] }),
  });
  assert.equal(missingVariantOrder.status, 422);
  assert.equal((await missingVariantOrder.json()).error.code, "VARIANT_REQUIRED");

  const missingVariantAdjustment = await request("/api/inventory", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, quantity: 1, type: "restock", locationId: "loc_main", location: "Asosiy ombor", note: "test" }),
  });
  assert.equal(missingVariantAdjustment.status, 422);
  assert.equal((await missingVariantAdjustment.json()).error.code, "VARIANT_REQUIRED");

  const invalidAdjustment = await request("/api/inventory", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, variantId: product.variants[0].id, quantity: -6, type: "adjustment", locationId: "loc_main", location: "Asosiy ombor", note: "test", idempotencyKey: "integration-adjustment-1" }),
  });
  assert.equal(invalidAdjustment.status, 409);
  assert.equal((await invalidAdjustment.json()).error.code, "INSUFFICIENT_AVAILABLE_STOCK");

  const orderResponse = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ customer: "Integration Buyer", channel: "POS", payment: "card", discount: 0, items: [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }] }),
  });
  assert.equal(orderResponse.status, 201);
  const order = (await orderResponse.json()).order;
  assert.equal(order.status, "paid");

  const cancelOrder = await request(`/api/orders/${encodeURIComponent(order.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelled" }),
  });
  assert.equal(cancelOrder.status, 200);
  assert.equal((await cancelOrder.json()).order.status, "cancelled");
  const productAfterCancellation = await request(`/api/products/${product.id}`);
  assert.equal((await productAfterCancellation.json()).product.variants[0].stock, 7);

  const report = await request("/api/reports/inventory?threshold=10");
  assert.equal(report.status, 200);
  const reportPayload = await report.json();
  assert.ok(reportPayload.report.summary.reservedUnits >= 2);

  const audit = await request(`/api/audit?entityType=product&entityId=${product.id}`);
  assert.equal(audit.status, 200);
  assert.ok((await audit.json()).pagination.total >= 1);

  const csv = "name,sku,category,cost_price,price,stock,status,visible,description\nCSV Product,CSV-001,Audio,100,150,3,draft,false,CSV import product";
  const dryRun = await request("/api/products/import?mode=upsert&dryRun=true", { method: "POST", headers: { "Content-Type": "text/csv" }, body: csv });
  assert.equal(dryRun.status, 200);
  assert.deepEqual(await dryRun.json(), { valid: true, rows: 1, dryRun: true });

  const exportResponse = await request("/api/products/export?format=csv");
  assert.equal(exportResponse.status, 200);
  assert.match(await exportResponse.text(), /INT-PHONE/);

  const bulkArchive = await request("/api/products/bulk", { method: "POST", body: JSON.stringify({ ids: [product.id], action: "archive" }) });
  assert.equal(bulkArchive.status, 200);
  assert.equal((await bulkArchive.json()).products[0].status, "archived");

  const bulkRestore = await request("/api/products/bulk", { method: "POST", body: JSON.stringify({ ids: [product.id], action: "restore" }) });
  assert.equal(bulkRestore.status, 200);
  assert.equal((await bulkRestore.json()).products[0].status, "draft");

  const remove = await request(`/api/products/${product.id}`, { method: "DELETE" });
  assert.equal(remove.status, 200);
  assert.ok((await remove.json()).product.deletedAt);
});
