import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";
import { hashSync } from "bcryptjs";

import { products as adminSeedProducts } from "@/lib/mock-data";
import { storefrontProducts } from "@/lib/storefront-data";

const databasePath = process.env.NEXORAPRO_DB_PATH ?? path.join(process.cwd(), "data", "nexora.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address TEXT
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    email TEXT PRIMARY KEY COLLATE NOCASE,
    failures INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '/products/iphone-17-pro.png',
    image_alt TEXT NOT NULL DEFAULT '',
    cost_price INTEGER NOT NULL DEFAULT 0 CHECK(cost_price >= 0),
    price INTEGER NOT NULL CHECK(price > 0),
    compare_at_price INTEGER,
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    status TEXT NOT NULL DEFAULT 'draft',
    visible_on_storefront INTEGER NOT NULL DEFAULT 0,
    languages_json TEXT NOT NULL DEFAULT '["UZ"]',
    sales INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    rating REAL NOT NULL DEFAULT 5,
    reviews INTEGER NOT NULL DEFAULT 0,
    colors_json TEXT NOT NULL DEFAULT '[]',
    specs_json TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    video_poster_url TEXT,
    video_title TEXT,
    video_eyebrow TEXT,
    video_source_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    customer TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    channel TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    subtotal INTEGER NOT NULL,
    discount INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0)
  );

  CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL REFERENCES products(id),
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    location TEXT NOT NULL DEFAULT 'Asosiy ombor',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_products_storefront ON products(visible_on_storefront, status);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
`);

const orderColumns = database.pragma("table_info(orders)") as Array<{ name: string }>;
if (!orderColumns.some((column) => column.name === "address")) {
  database.exec("ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''");
}
if (!orderColumns.some((column) => column.name === "user_id")) {
  database.exec("ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
}
database.exec("CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC)");

const seedAdmin = () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    ?? (process.env.NODE_ENV === "development" ? "admin@nexorapro.dev" : "");
  const password = process.env.ADMIN_PASSWORD
    ?? (process.env.NODE_ENV === "development" ? "NexoraAdmin2026!" : "");
  const name = process.env.ADMIN_NAME?.trim() || "Oybek Aka";
  if (!email || !password) return;
  const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return;
  database.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(`usr_${randomUUID().slice(0, 12)}`, name, email, hashSync(password, 12));
};

const seedProducts = database.transaction(() => {
  const count = database.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (count.count > 0) return;

  const insert = database.prepare(`
    INSERT INTO products (
      id, slug, name, sku, category, description, image, image_alt, cost_price, price,
      compare_at_price, stock, status, visible_on_storefront, languages_json, sales,
      badge, rating, reviews, colors_json, specs_json, featured, video_url,
      video_poster_url, video_title, video_eyebrow, video_source_url
    ) VALUES (
      @id, @slug, @name, @sku, @category, @description, @image, @imageAlt, @costPrice, @price,
      @compareAtPrice, @stock, @status, @visibleOnStorefront, @languages, @sales,
      @badge, @rating, @reviews, @colors, @specs, @featured, @videoUrl,
      @videoPosterUrl, @videoTitle, @videoEyebrow, @videoSourceUrl
    )
  `);

  for (const [index, adminProduct] of adminSeedProducts.entries()) {
    const storeProduct = storefrontProducts.find((product) => product.name === adminProduct.name);
    const id = storeProduct?.id ?? adminProduct.id;
    const slug = storeProduct?.slug ?? adminProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    insert.run({
      id,
      slug,
      name: adminProduct.name,
      sku: adminProduct.sku,
      category: adminProduct.category,
      description: storeProduct?.description ?? `${adminProduct.name} uchun premium mahsulot sahifasi.`,
      image: storeProduct?.image ?? "/products/iphone-17-pro.png",
      imageAlt: storeProduct?.imageAlt ?? adminProduct.name,
      costPrice: adminProduct.costPrice,
      price: adminProduct.price,
      compareAtPrice: adminProduct.compareAtPrice ?? null,
      stock: adminProduct.stock,
      status: adminProduct.status,
      visibleOnStorefront: Number(adminProduct.visibleOnStorefront),
      languages: JSON.stringify(adminProduct.languages),
      sales: adminProduct.sales,
      badge: storeProduct?.badge ?? null,
      rating: storeProduct?.rating ?? 5,
      reviews: storeProduct?.reviews ?? 0,
      colors: JSON.stringify(storeProduct?.colors ?? []),
      specs: JSON.stringify(storeProduct?.specs ?? []),
      featured: Number(storeProduct?.featured ?? index < 4),
      videoUrl: storeProduct?.video?.src ?? adminProduct.videoUrl ?? null,
      videoPosterUrl: storeProduct?.video?.poster ?? adminProduct.videoPosterUrl ?? null,
      videoTitle: storeProduct?.video?.title ?? null,
      videoEyebrow: storeProduct?.video?.eyebrow ?? null,
      videoSourceUrl: storeProduct?.video?.sourceUrl ?? null,
    });
  }
});

const seedOrders = database.transaction(() => {
  const count = database.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
  if (count.count > 0) return;
  const orderInsert = database.prepare("INSERT INTO orders (id, customer, phone, channel, payment, status, subtotal, discount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now', ?))");
  const itemInsert = database.prepare("INSERT INTO order_items (order_id, product_id, product_name, sku, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
  const samples = [
    ["#NX-1062", "Sardor Karimov", "+998 90 123 45 67", "Online", "card", "new", "iPhone 17 Pro", 1, "-8 minutes"],
    ["#NX-1061", "Madina Islomova", "+998 93 612 08 21", "Online", "click", "paid", "AirPods Pro 3", 2, "-32 minutes"],
    ["#NX-1060", "Azizbek Tursunov", "+998 99 440 18 12", "POS", "card", "packing", "MacBook Air 13 M5", 1, "-56 minutes"],
    ["#NX-1059", "Kamola Rahimova", "+998 97 221 77 03", "Online", "payme", "shipping", "iPad Air 11 M4", 1, "-90 minutes"],
  ] as const;
  for (const sample of samples) {
    const product = database.prepare("SELECT id, name, sku, price FROM products WHERE name = ?").get(sample[6]) as { id: string; name: string; sku: string; price: number };
    const subtotal = product.price * sample[7];
    orderInsert.run(sample[0], sample[1], sample[2], sample[3], sample[4], sample[5], subtotal, subtotal, sample[8]);
    itemInsert.run(sample[0], product.id, product.name, product.sku, product.price, sample[7]);
  }
});

seedAdmin();
seedProducts();
seedOrders();

export { database };
