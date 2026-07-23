import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";
import { hashSync } from "bcryptjs";

import { products as adminSeedProducts } from "@/lib/mock-data";
import { storefrontProducts } from "@/lib/storefront-data";

const databasePath = process.env.NEXORAPRO_DB_PATH ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "nexora.db");
fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");
database.pragma("synchronous = NORMAL");
// Read-path tuning sized for the 1 GB VPS: an 8 MB page cache and memory temp
// store keep hot catalog/report queries off disk; mmap serves reads without
// syscall/copy overhead (virtual memory, not resident).
database.pragma("cache_size = -8192");
database.pragma("temp_store = MEMORY");
database.pragma("mmap_size = 134217728");

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
    image TEXT NOT NULL DEFAULT '/products/iphone-17-pro.webp',
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

  CREATE TABLE IF NOT EXISTS product_translations (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    locale TEXT NOT NULL CHECK(locale IN ('UZ', 'RU', 'EN')),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_alt TEXT NOT NULL DEFAULT '',
    badge TEXT,
    specs_json TEXT NOT NULL DEFAULT '[]',
    video_title TEXT,
    video_eyebrow TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, locale)
  );

  CREATE TABLE IF NOT EXISTS orders (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    customer TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    address_lat REAL,
    address_lng REAL,
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
  CREATE INDEX IF NOT EXISTS idx_product_translations_locale ON product_translations(locale, product_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
`);

type Migration = {
  version: number;
  name: string;
  run: () => void;
};

database.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function hasColumn(table: string, column: string) {
  const columns = database.pragma(`table_info(${table})`) as Array<{ name: string }>;
  return columns.some((item) => item.name === column);
}

function addColumn(table: string, definition: string) {
  const column = definition.trim().split(/\s+/, 1)[0];
  if (!hasColumn(table, column)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

const migrations: Migration[] = [
  {
    version: 2,
    name: "product_catalog_inventory_audit",
    run: () => {
      addColumn("products", "version INTEGER NOT NULL DEFAULT 1");
      addColumn("products", "deleted_at TEXT");
      addColumn("products", "deleted_by TEXT");
      addColumn("inventory_movements", "variant_id TEXT");
      addColumn("inventory_movements", "location_id TEXT");
      addColumn("inventory_movements", "balance_after INTEGER");
      addColumn("inventory_movements", "reference_type TEXT");
      addColumn("inventory_movements", "reference_id TEXT");
      addColumn("inventory_movements", "idempotency_key TEXT");
      addColumn("inventory_movements", "actor_user_id TEXT");
      addColumn("order_items", "variant_id TEXT");
      addColumn("order_items", "variant_title TEXT");

      database.exec(`
        CREATE TABLE IF NOT EXISTS product_variants (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          barcode TEXT UNIQUE,
          cost_price INTEGER NOT NULL DEFAULT 0 CHECK(cost_price >= 0),
          price INTEGER NOT NULL CHECK(price > 0),
          compare_at_price INTEGER CHECK(compare_at_price IS NULL OR compare_at_price > 0),
          stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
          options_json TEXT NOT NULL DEFAULT '{}',
          position INTEGER NOT NULL DEFAULT 0,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS product_media (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
          media_type TEXT NOT NULL DEFAULT 'image' CHECK(media_type IN ('image', 'video')),
          url TEXT NOT NULL,
          mime_type TEXT,
          alt_text TEXT NOT NULL DEFAULT '',
          width INTEGER,
          height INTEGER,
          size_bytes INTEGER,
          position INTEGER NOT NULL DEFAULT 0,
          is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory_locations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          code TEXT NOT NULL UNIQUE,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory_reservations (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id),
          variant_id TEXT REFERENCES product_variants(id),
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          reference_type TEXT NOT NULL,
          reference_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'released', 'committed', 'expired')),
          expires_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          before_json TEXT,
          after_json TEXT,
          request_id TEXT,
          ip_address TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_admin_list
          ON products(deleted_at, status, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_products_category_status
          ON products(category, status, deleted_at);
        CREATE INDEX IF NOT EXISTS idx_products_search_name
          ON products(name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_product_variants_product
          ON product_variants(product_id, deleted_at, position);
        CREATE INDEX IF NOT EXISTS idx_product_media_product
          ON product_media(product_id, position);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_primary
          ON product_media(product_id) WHERE is_primary = 1 AND variant_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product
          ON inventory_reservations(product_id, variant_id, status, expires_at);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_movement_idempotency
          ON inventory_movements(idempotency_key) WHERE idempotency_key IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_audit_entity
          ON audit_logs(entity_type, entity_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_audit_actor
          ON audit_logs(actor_user_id, created_at DESC);

        INSERT OR IGNORE INTO inventory_locations (id, name, code)
        VALUES ('loc_main', 'Asosiy ombor', 'MAIN');
      `);
    },
  },
  {
    version: 3,
    name: "reporting_order_snapshots",
    run: () => {
      addColumn("order_items", "cost_price INTEGER NOT NULL DEFAULT 0");
      database.exec(`
        UPDATE order_items
        SET cost_price = COALESCE((SELECT cost_price FROM products WHERE products.id = order_items.product_id), 0)
        WHERE cost_price = 0;
        CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_channel_created ON orders(channel, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id, order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id, order_id);
      `);
    },
  },
  {
    version: 4,
    name: "product_pagination_covering_indexes",
    run: () => {
      database.exec(`
        DROP INDEX IF EXISTS idx_products_admin_list;
        CREATE INDEX idx_products_admin_list
          ON products(deleted_at, updated_at DESC, id ASC);
        CREATE INDEX IF NOT EXISTS idx_products_admin_status
          ON products(deleted_at, status, updated_at DESC, id ASC);
      `);
    },
  },
    {
      version: 5,
      name: "default_product_images_webp",
    run: () => {
      const replacements = [
        ["/products/iphone-17-pro.png", "/products/iphone-17-pro.webp"],
        ["/products/macbook-air-m5.png", "/products/macbook-air-m5.webp"],
        ["/products/ipad-air-m4.png", "/products/ipad-air-m4.webp"],
        ["/products/airpods-pro-3.png", "/products/airpods-pro-3.webp"],
      ] as const;
      const updateProduct = database.prepare("UPDATE products SET image = ?, updated_at = CURRENT_TIMESTAMP WHERE image = ?");
      const updateMedia = database.prepare("UPDATE product_media SET url = ?, updated_at = CURRENT_TIMESTAMP WHERE url = ?");

      for (const [from, to] of replacements) {
        updateProduct.run(to, from);
        updateMedia.run(to, from);
        }
      },
    },
    {
      version: 6,
      name: "default_video_posters_webp",
      run: () => {
        const replacements = [
          ["/products/videos/iphone-17-pro-forged-plateau.jpg", "/products/videos/iphone-17-pro-forged-plateau.webp"],
          ["/products/videos/iphone-17-pro-camera-center-stage.jpg", "/products/videos/iphone-17-pro-camera-center-stage.webp"],
        ] as const;
        const updateVideoPoster = database.prepare("UPDATE products SET video_poster_url = ?, updated_at = CURRENT_TIMESTAMP WHERE video_poster_url = ?");
        for (const [from, to] of replacements) {
          updateVideoPoster.run(to, from);
        }
      },
    },
  ];

const appliedMigrations = database.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>;
const appliedVersions = new Set(appliedMigrations.map(({ version }) => version));
const pendingMigrations = migrations.filter((migration) => !appliedVersions.has(migration.version));

if (pendingMigrations.length > 0 && databasePath !== ":memory:" && fs.existsSync(/*turbopackIgnore: true*/ databasePath) && fs.statSync(/*turbopackIgnore: true*/ databasePath).size > 0) {
  const backupDirectory = process.env.DB_MIGRATION_BACKUP_DIR ?? path.join(/*turbopackIgnore: true*/ path.dirname(databasePath), "migration-backups");
  fs.mkdirSync(/*turbopackIgnore: true*/ backupDirectory, { recursive: true, mode: 0o750 });
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const backupPath = path.join(/*turbopackIgnore: true*/ backupDirectory, `nexora-before-v${pendingMigrations[0].version}-${stamp}-${randomUUID().slice(0, 8)}.db`);
  database.prepare("VACUUM INTO ?").run(backupPath);
  fs.chmodSync(/*turbopackIgnore: true*/ backupPath, 0o600);
}

const runMigrations = database.transaction(() => {
  for (const migration of pendingMigrations) {
    migration.run();
    database.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(migration.version, migration.name);
  }
});

runMigrations();

const orderColumns = database.pragma("table_info(orders)") as Array<{ name: string }>;
if (!orderColumns.some((column) => column.name === "address")) {
  database.exec("ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''");
}
if (!orderColumns.some((column) => column.name === "user_id")) {
  database.exec("ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
}
if (!orderColumns.some((column) => column.name === "address_lat")) {
  database.exec("ALTER TABLE orders ADD COLUMN address_lat REAL");
}
if (!orderColumns.some((column) => column.name === "address_lng")) {
  database.exec("ALTER TABLE orders ADD COLUMN address_lng REAL");
}
database.exec("CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC)");

const seedAdmin = () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    ?? (process.env.NODE_ENV === "development" ? "admin@nexorapro.uz" : "");
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
      image: storeProduct?.image ?? "/products/iphone-17-pro.webp",
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
  const itemInsert = database.prepare("INSERT INTO order_items (order_id, product_id, product_name, sku, cost_price, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const samples = [
    ["#NX-1062", "Sardor Karimov", "+998 90 123 45 67", "Online", "card", "new", "iPhone 17 Pro", 1, "-8 minutes"],
    ["#NX-1061", "Madina Islomova", "+998 93 612 08 21", "Online", "click", "paid", "AirPods Pro 3", 2, "-32 minutes"],
    ["#NX-1060", "Azizbek Tursunov", "+998 99 440 18 12", "POS", "card", "packing", "MacBook Air 13 M5", 1, "-56 minutes"],
    ["#NX-1059", "Kamola Rahimova", "+998 97 221 77 03", "Online", "payme", "shipping", "iPad Air 11 M4", 1, "-90 minutes"],
  ] as const;
  for (const sample of samples) {
    const product = database.prepare("SELECT id, name, sku, cost_price, price FROM products WHERE name = ?").get(sample[6]) as { id: string; name: string; sku: string; cost_price: number; price: number };
    const subtotal = product.price * sample[7];
    orderInsert.run(sample[0], sample[1], sample[2], sample[3], sample[4], sample[5], subtotal, subtotal, sample[8]);
    itemInsert.run(sample[0], product.id, product.name, product.sku, product.cost_price, product.price, sample[7]);
  }
});

const migrateProductTranslations = database.transaction(() => {
  // Fast path: every product already has its base UZ translation, so skip the
  // full-table scan + languages_json rewrite this backfill would otherwise run
  // on every process start.
  const missing = database.prepare(`
    SELECT COUNT(*) AS count FROM products
    WHERE id NOT IN (SELECT product_id FROM product_translations WHERE locale = 'UZ')
  `).get() as { count: number };
  if (missing.count === 0) return;

  const products = database.prepare(`
    SELECT id, name, description, image_alt, badge, specs_json, video_title, video_eyebrow
    FROM products
  `).all() as Array<{
    id: string;
    name: string;
    description: string;
    image_alt: string;
    badge: string | null;
    specs_json: string;
    video_title: string | null;
    video_eyebrow: string | null;
  }>;
  const insert = database.prepare(`
    INSERT OR IGNORE INTO product_translations (
      product_id, locale, name, description, image_alt, badge, specs_json, video_title, video_eyebrow
    ) VALUES (?, 'UZ', ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const product of products) {
    insert.run(
      product.id,
      product.name,
      product.description,
      product.image_alt,
      product.badge,
      product.specs_json,
      product.video_title,
      product.video_eyebrow,
    );
  }
  database.exec(`
    UPDATE products
    SET languages_json = COALESCE((
      SELECT json_group_array(locale)
      FROM product_translations
      WHERE product_id = products.id
    ), '["UZ"]')
  `);
});

seedAdmin();
seedProducts();
migrateProductTranslations();
seedOrders();

export { database };
