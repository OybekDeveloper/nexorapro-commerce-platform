import "server-only";

import { randomUUID } from "node:crypto";

import type {
  CommerceAnalytics,
  CommerceOrder,
  CommerceOrderItem,
  CommerceProduct,
  CreateOrderInput,
  CreateProductInput,
  InventoryMovement,
  InventoryMovementInput,
  OrderStatus,
  UpdateProductInput,
} from "@/lib/commerce";
import type { ProductCategory } from "@/lib/types";
import { database } from "@/server/database";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: ProductCategory;
  description: string;
  image: string;
  image_alt: string;
  cost_price: number;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: CommerceProduct["status"];
  visible_on_storefront: number;
  languages_json: string;
  sales: number;
  badge: string | null;
  rating: number;
  reviews: number;
  colors_json: string;
  specs_json: string;
  featured: number;
  video_url: string | null;
  video_poster_url: string | null;
  video_title: string | null;
  video_eyebrow: string | null;
  video_source_url: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = Omit<CommerceOrder, "items" | "createdAt" | "userId" | "addressLatitude" | "addressLongitude"> & {
  created_at: string;
  user_id: string | null;
  address_lat: number | null;
  address_lng: number | null;
};

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapProduct(row: ProductRow): CommerceProduct {
  const video = row.video_url ? {
    src: row.video_url,
    poster: row.video_poster_url ?? row.image,
    title: row.video_title ?? row.name,
    eyebrow: row.video_eyebrow ?? "Mahsulot videosi",
    sourceUrl: row.video_source_url ?? row.video_url,
  } : undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description,
    image: row.image,
    imageAlt: row.image_alt,
    video,
    videoUrl: row.video_url ?? undefined,
    videoPosterUrl: row.video_poster_url ?? undefined,
    costPrice: row.cost_price,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    stock: row.stock,
    status: row.status,
    visibleOnStorefront: Boolean(row.visible_on_storefront),
    languages: parseStringArray(row.languages_json) as CommerceProduct["languages"],
    sales: row.sales,
    badge: row.badge ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    colors: parseStringArray(row.colors_json),
    specs: parseStringArray(row.specs_json),
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getOrderItems(orderId: string): CommerceOrderItem[] {
  return database.prepare(`
    SELECT product_id AS productId, product_name AS productName, sku, price, quantity
    FROM order_items WHERE order_id = ? ORDER BY id
  `).all(orderId) as CommerceOrderItem[];
}

function mapOrder(row: OrderRow, items = getOrderItems(row.id)): CommerceOrder {
  const { created_at, user_id, address_lat, address_lng, ...order } = row;
  return {
    ...order,
    userId: user_id ?? undefined,
    addressLatitude: address_lat ?? undefined,
    addressLongitude: address_lng ?? undefined,
    createdAt: created_at,
    items,
  };
}

function mapOrders(rows: OrderRow[]) {
  if (rows.length === 0) return [];
  const placeholders = rows.map(() => "?").join(",");
  const items = database.prepare(`
    SELECT order_id AS orderId, product_id AS productId, product_name AS productName, sku, price, quantity
    FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id
  `).all(...rows.map((row) => row.id)) as Array<CommerceOrderItem & { orderId: string }>;
  const byOrder = new Map<string, CommerceOrderItem[]>();
  for (const { orderId, ...item } of items) {
    const group = byOrder.get(orderId) ?? [];
    group.push(item);
    byOrder.set(orderId, group);
  }
  return rows.map((row) => mapOrder(row, byOrder.get(row.id) ?? []));
}

export function listProducts(options: { storefrontOnly?: boolean } = {}) {
  const query = options.storefrontOnly
    ? "SELECT * FROM products WHERE visible_on_storefront = 1 AND status = 'published' ORDER BY featured DESC, created_at ASC"
    : "SELECT * FROM products ORDER BY created_at DESC, name ASC";
  return (database.prepare(query).all() as ProductRow[]).map(mapProduct);
}

export function getProduct(idOrSlug: string) {
  const row = database.prepare("SELECT * FROM products WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

function uniqueSlug(name: string, excludedId?: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mahsulot";
  let slug = base;
  let suffix = 2;
  const exists = database.prepare("SELECT id FROM products WHERE slug = ? AND id != COALESCE(?, '')");
  while (exists.get(slug, excludedId)) slug = `${base}-${suffix++}`;
  return slug;
}

export function createProduct(input: CreateProductInput) {
  const id = `prd_${randomUUID().slice(0, 12)}`;
  const slug = uniqueSlug(input.name);
  const visible = input.status === "published" && input.visibleOnStorefront;
  database.prepare(`
    INSERT INTO products (
      id, slug, name, sku, category, description, image, image_alt, cost_price, price,
      compare_at_price, stock, status, visible_on_storefront, languages_json, video_url,
      video_poster_url, colors_json, specs_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]')
  `).run(
    id, slug, input.name, input.sku, input.category,
    input.description ?? `${input.name} — nexorapro.dev katalogidagi yangi mahsulot.`,
    input.image ?? "/products/iphone-17-pro.png", input.imageAlt ?? input.name,
    input.costPrice, input.price, input.compareAtPrice ?? null, input.stock,
    input.status, Number(visible), JSON.stringify(input.languages),
    input.videoUrl || null, input.videoPosterUrl || null,
  );
  if (input.stock > 0) {
    database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, note) VALUES (?, 'restock', ?, 'Boshlang‘ich qoldiq')").run(id, input.stock);
  }
  return getProduct(id)!;
}

export function updateProduct(id: string, input: UpdateProductInput) {
  const current = getProduct(id);
  if (!current) return null;
  const next = {
    ...current,
    ...input,
    slug: input.name ? uniqueSlug(input.name, id) : current.slug,
    languages: input.addLanguage && !current.languages.includes(input.addLanguage)
      ? [...current.languages, input.addLanguage]
      : input.languages ?? current.languages,
  };
  const stock = Math.max(0, current.stock + (input.stockDelta ?? 0));
  const nextStock = input.stock ?? stock;
  const visible = next.status === "published" && next.visibleOnStorefront;
  database.prepare(`
    UPDATE products SET slug = ?, name = ?, sku = ?, category = ?, description = ?, image = ?,
      image_alt = ?, cost_price = ?, price = ?, compare_at_price = ?, stock = ?, status = ?,
      visible_on_storefront = ?, languages_json = ?, video_url = ?, video_poster_url = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(
    next.slug, next.name, next.sku, next.category, next.description, next.image, next.imageAlt,
    next.costPrice, next.price, next.compareAtPrice ?? null, nextStock, next.status,
    Number(visible), JSON.stringify(next.languages), next.videoUrl || null,
    next.videoPosterUrl || null, id,
  );
  if (input.stockDelta) {
    database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, note) VALUES (?, 'adjustment', ?, 'Mahsulot kartasidan qoldiq yangilandi')").run(id, input.stockDelta);
  }
  return getProduct(id)!;
}

export function archiveProduct(id: string) {
  const result = database.prepare("UPDATE products SET status = 'archived', visible_on_storefront = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return result.changes > 0 ? getProduct(id) : null;
}

export function listOrders() {
  const rows = database.prepare("SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders ORDER BY datetime(created_at) DESC, sequence DESC").all() as OrderRow[];
  return mapOrders(rows);
}

export function listOrdersByUser(userId: string) {
  const rows = database.prepare("SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders WHERE user_id = ? ORDER BY datetime(created_at) DESC, sequence DESC").all(userId) as OrderRow[];
  return mapOrders(rows);
}

export function getOrder(id: string) {
  const row = database.prepare("SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  return row ? mapOrder(row) : null;
}

export function createOrder(input: CreateOrderInput, userId?: string) {
  return database.transaction(() => {
    const requested = new Map<string, number>();
    for (const item of input.items) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
    const lines = [...requested].map(([productId, quantity]) => {
      const product = getProduct(productId);
      if (!product || product.status !== "published") throw new Error("Mahsulot sotuv uchun mavjud emas");
      if (product.stock < quantity) throw new Error(`${product.name}: omborda faqat ${product.stock} dona mavjud`);
      return { product, quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const discount = Math.min(subtotal, input.discount);
    const total = subtotal - discount;
    const latest = database.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(id, 5) AS INTEGER)), 1000) AS value FROM orders").get() as { value: number };
    const id = `#NX-${latest.value + 1}`;
    database.prepare(`
      INSERT INTO orders (id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.customer || "Mehmon mijoz",
      input.phone,
      input.address,
      input.addressLatitude ?? null,
      input.addressLongitude ?? null,
      input.channel,
      input.payment,
      input.channel === "POS" ? "paid" : "new",
      subtotal,
      discount,
      total,
      userId ?? null,
    );
    const insertItem = database.prepare("INSERT INTO order_items (order_id, product_id, product_name, sku, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
    const updateStock = database.prepare("UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ?");
    const movement = database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, note) VALUES (?, 'sale', ?, ?)");
    for (const line of lines) {
      insertItem.run(id, line.product.id, line.product.name, line.product.sku, line.product.price, line.quantity);
      const stockResult = updateStock.run(line.quantity, line.quantity, line.product.id, line.quantity);
      if (stockResult.changes !== 1) throw new Error(`${line.product.name}: qoldiq o‘zgardi, qayta urinib ko‘ring`);
      movement.run(line.product.id, -line.quantity, `${id} sotuv`);
    }
    return getOrder(id)!;
  })();
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const result = database.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return result.changes > 0 ? getOrder(id) : null;
}

export function listInventoryMovements() {
  return database.prepare(`
    SELECT m.id, m.product_id AS productId, p.name AS productName, m.type, m.quantity,
      m.location, m.note, m.created_at AS createdAt
    FROM inventory_movements m JOIN products p ON p.id = m.product_id
    ORDER BY m.id DESC LIMIT 100
  `).all() as InventoryMovement[];
}

export function createInventoryMovement(input: InventoryMovementInput) {
  return database.transaction(() => {
    const product = getProduct(input.productId);
    if (!product) throw new Error("Mahsulot topilmadi");
    const nextStock = product.stock + input.quantity;
    if (nextStock < 0) throw new Error("Qoldiq manfiy bo‘lishi mumkin emas");
    database.prepare("UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nextStock, input.productId);
    const info = database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, location, note) VALUES (?, ?, ?, ?, ?)").run(input.productId, input.type, input.quantity, input.location, input.note);
    return database.prepare(`
      SELECT m.id, m.product_id AS productId, p.name AS productName, m.type, m.quantity,
        m.location, m.note, m.created_at AS createdAt
      FROM inventory_movements m JOIN products p ON p.id = m.product_id WHERE m.id = ?
    `).get(info.lastInsertRowid) as InventoryMovement;
  })();
}

export function getAnalytics(): CommerceAnalytics {
  const totals = database.prepare(`
    SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orderCount
    FROM orders WHERE status != 'cancelled'
  `).get() as { revenue: number; orderCount: number };
  const productTotals = database.prepare(`
    SELECT COALESCE(SUM(sales), 0) AS unitsSold,
      COALESCE(SUM((price - cost_price) * sales), 0) AS profit,
      SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS lowStockCount,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedProducts
    FROM products
  `).get() as Omit<CommerceAnalytics, "revenue" | "orderCount" | "categorySales" | "recentOrders">;
  const categorySales = database.prepare("SELECT category AS name, SUM(sales) AS value FROM products GROUP BY category ORDER BY value DESC").all() as CommerceAnalytics["categorySales"];
  return { ...totals, ...productTotals, categorySales, recentOrders: listOrders().slice(0, 6) };
}
