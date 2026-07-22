import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

import Database from "better-sqlite3";

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nexorapro-benchmark-"));
const databasePath = path.join(directory, "benchmark.db");
const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("synchronous = NORMAL");
database.exec(`
  CREATE TABLE products (
    id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, price INTEGER NOT NULL, cost_price INTEGER NOT NULL, stock INTEGER NOT NULL,
    sales INTEGER NOT NULL, status TEXT NOT NULL, visible_on_storefront INTEGER NOT NULL,
    deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE product_translations (product_id TEXT NOT NULL, locale TEXT NOT NULL, name TEXT NOT NULL, PRIMARY KEY(product_id, locale));
  CREATE TABLE product_variants (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, position INTEGER NOT NULL, deleted_at TEXT);
  CREATE TABLE product_media (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, position INTEGER NOT NULL);
  CREATE TABLE orders (sequence INTEGER PRIMARY KEY, id TEXT UNIQUE, status TEXT NOT NULL, total INTEGER NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, quantity INTEGER NOT NULL, price INTEGER NOT NULL, cost_price INTEGER NOT NULL);
  CREATE INDEX idx_products_admin_list ON products(deleted_at, updated_at DESC, id ASC);
  CREATE INDEX idx_products_admin_status ON products(deleted_at, status, updated_at DESC, id ASC);
  CREATE INDEX idx_products_storefront ON products(visible_on_storefront, status);
  CREATE INDEX idx_product_variants_product ON product_variants(product_id, deleted_at, position);
  CREATE INDEX idx_product_media_product ON product_media(product_id, position);
  CREATE INDEX idx_orders_created ON orders(created_at DESC);
  CREATE INDEX idx_order_items_product ON order_items(product_id, order_id);
`);

const insertProduct = database.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)");
const insertTranslation = database.prepare("INSERT INTO product_translations VALUES (?, 'UZ', ?)");
const insertVariant = database.prepare("INSERT INTO product_variants VALUES (?, ?, 0, NULL)");
const insertMedia = database.prepare("INSERT INTO product_media VALUES (?, ?, 0)");
const insertOrder = database.prepare("INSERT INTO orders VALUES (?, ?, ?, ?, ?)");
const insertItem = database.prepare("INSERT INTO order_items VALUES (NULL, ?, ?, ?, ?, ?)");

database.transaction(() => {
  for (let index = 1; index <= 10_000; index += 1) {
    const id = `prd_${index}`;
    const name = `Benchmark Product ${index}`;
    const status = index % 5 === 0 ? "draft" : "published";
    const timestamp = new Date(Date.now() - index * 1_000).toISOString();
    insertProduct.run(id, `benchmark-product-${index}`, name, `SKU-${String(index).padStart(6, "0")}`, index % 2 ? "Smartfon" : "Audio", 1_000 + index, 700 + index, index % 50, index % 100, status, Number(status === "published"), timestamp, timestamp);
    insertTranslation.run(id, name);
    if (index % 3 === 0) insertVariant.run(`var_${index}`, id);
    if (index % 2 === 0) insertMedia.run(`med_${index}`, id);
  }
  for (let index = 1; index <= 5_000; index += 1) {
    const id = `#NX-${index}`;
    insertOrder.run(index, id, index % 20 === 0 ? "cancelled" : "completed", 10_000 + index, new Date(Date.now() - index * 60_000).toISOString());
    for (let line = 0; line < 3; line += 1) insertItem.run(id, `prd_${((index * 3 + line) % 10_000) + 1}`, line + 1, 2_000 + line, 1_200 + line);
  }
})();

function measure(name, iterations, action) {
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    action();
    samples.push(performance.now() - started);
  }
  samples.sort((left, right) => left - right);
  return {
    name,
    iterations,
    medianMs: Number(samples[Math.floor(samples.length * 0.5)].toFixed(3)),
    p95Ms: Number(samples[Math.floor(samples.length * 0.95)].toFixed(3)),
  };
}

const adminPage = database.prepare("SELECT * FROM products WHERE deleted_at IS NULL AND status = ? ORDER BY updated_at DESC, id ASC LIMIT 25 OFFSET 0");
const recentOrders = database.prepare("SELECT * FROM orders ORDER BY datetime(created_at) DESC, sequence DESC LIMIT 6");
const allOrders = database.prepare("SELECT * FROM orders ORDER BY datetime(created_at) DESC, sequence DESC");
const orderItemsForIds = (ids) => database.prepare(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`).all(...ids);
const productById = database.prepare("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL");
const translationsById = database.prepare("SELECT * FROM product_translations WHERE product_id = ?");
const fiftyProductIds = Array.from({ length: 50 }, (_, index) => `prd_${index + 1}`);

const results = [
  measure("admin product page (10k products, 25 rows)", 100, () => adminPage.all("published")),
  measure("recent orders optimized (6 orders + items)", 100, () => {
    const orders = recentOrders.all();
    orderItemsForIds(orders.map((order) => order.id));
  }),
  measure("recent orders legacy (all 5k orders + items)", 20, () => {
    const orders = allOrders.all();
    orderItemsForIds(orders.map((order) => order.id));
  }),
  measure("50 cart lines optimized fixed product query", 100, () => {
    const placeholders = fiftyProductIds.map(() => "?").join(",");
    database.prepare(`SELECT id, name, sku, cost_price, price, stock, status, deleted_at FROM products WHERE id IN (${placeholders})`).all(...fiftyProductIds);
  }),
  measure("50 cart lines legacy N+1", 100, () => {
    for (const id of fiftyProductIds) {
      productById.get(id);
      translationsById.all(id);
    }
  }),
];

const queryPlan = database.prepare("EXPLAIN QUERY PLAN SELECT * FROM products WHERE deleted_at IS NULL AND status = 'published' ORDER BY updated_at DESC, id ASC LIMIT 25").all().map((row) => row.detail);
process.stdout.write(`${JSON.stringify({ dataset: { products: 10_000, orders: 5_000, orderItems: 15_000 }, results, queryPlan }, null, 2)}\n`);

database.close();
await fs.rm(directory, { recursive: true, force: true });
