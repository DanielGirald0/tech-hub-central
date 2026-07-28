// Alegra catalog proxy: reads items and categories from Alegra API on demand,
// with a small in-memory cache to reduce repeated calls.
// Public function (verify_jwt = false).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALEGRA_BASE = "https://api.alegra.com/api/v1";

function alegraAuth() {
  const email = Deno.env.get("ALEGRA_EMAIL");
  const token = Deno.env.get("ALEGRA_API_TOKEN");
  if (!email || !token) throw new Error("Alegra credentials not configured");
  return "Basic " + btoa(`${email}:${token}`);
}

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  reference: string;
  price: number;
  final_price: number;
  original_price: number | null;
  stock: number;
  category: string;
  category_id: string;
  brand: string;
  image_url: string | null;
  product_type: "product" | "service";
  inStock: boolean;
  tax_percentage: number;
};

function mapItem(raw: any): CatalogItem {
  const priceEntry = Array.isArray(raw?.price) ? raw.price[0] : raw?.price;
  const price = Number(priceEntry?.price ?? priceEntry ?? 0) || 0;
  const tax = Array.isArray(raw?.tax) ? raw.tax[0] : raw?.tax;
  const taxPct = Number(tax?.percentage ?? 0) || 0;
  const invQty = Number(
    raw?.inventory?.availableQuantity ??
      raw?.inventory?.unitCost?.availableQuantity ??
      raw?.availableQuantity ??
      raw?.quantityAvailable ??
      0,
  );
  const type = raw?.type === "service" || raw?.type === "kit" ? "service" : "product";
  const stock = type === "service" ? 9999 : (Number.isFinite(invQty) ? invQty : 0);
  const image = Array.isArray(raw?.images) && raw.images.length
    ? (raw.images[0]?.url || raw.images[0]?.original || null)
    : null;

  // brand from customFields if present
  let brand = "";
  const cf = raw?.customFields;
  if (Array.isArray(cf)) {
    const b = cf.find((f: any) =>
      String(f?.name || f?.key || "").toLowerCase().includes("marca") ||
      String(f?.name || f?.key || "").toLowerCase().includes("brand"),
    );
    if (b) brand = String(b.value ?? b.textValue ?? "");
  }

  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    reference: String(raw.reference ?? ""),
    price,
    final_price: price,
    original_price: null,
    stock,
    category: String(raw?.category?.name ?? ""),
    category_id: raw?.category?.id ? String(raw.category.id) : "",
    brand,
    image_url: image,
    product_type: type,
    inStock: stock > 0,
    tax_percentage: taxPct,
  };
}

// In-memory cache (per edge-function instance)
const CACHE_TTL_MS = 5 * 60 * 1000;
let itemsCache: { at: number; items: CatalogItem[] } | null = null;
let categoriesCache: { at: number; items: Array<{ id: string; name: string }> } | null = null;
let inflightItems: Promise<CatalogItem[]> | null = null;

async function fetchAllItems(): Promise<CatalogItem[]> {
  if (itemsCache && Date.now() - itemsCache.at < CACHE_TTL_MS) return itemsCache.items;
  if (inflightItems) return inflightItems;
  inflightItems = (async () => {
    const auth = alegraAuth();
    const all: any[] = [];
    let start = 0;
    const limit = 30;
    while (true) {
      const res = await fetch(`${ALEGRA_BASE}/items?start=${start}&limit=${limit}`, {
        headers: { Authorization: auth, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Alegra items ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const batch: any[] = Array.isArray(data) ? data : (data.data || []);
      if (batch.length === 0) break;
      all.push(...batch);
      if (batch.length < limit) break;
      start += limit;
      if (start > 5000) break; // safety cap
    }
    const mapped = all.map(mapItem);
    itemsCache = { at: Date.now(), items: mapped };
    return mapped;
  })();
  try {
    return await inflightItems;
  } finally {
    inflightItems = null;
  }
}

async function fetchCategories() {
  if (categoriesCache && Date.now() - categoriesCache.at < CACHE_TTL_MS) return categoriesCache.items;
  const auth = alegraAuth();
  const res = await fetch(`${ALEGRA_BASE}/item-categories`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) {
    // Fallback: derive from items
    const items = await fetchAllItems();
    const map = new Map<string, string>();
    for (const it of items) {
      if (it.category_id && !map.has(it.category_id)) map.set(it.category_id, it.category);
    }
    const list = Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "es"));
    categoriesCache = { at: Date.now(), items: list };
    return list;
  }
  const data = await res.json();
  const arr: any[] = Array.isArray(data) ? data : (data.data || []);
  const list = arr.map((c) => ({ id: String(c.id), name: String(c.name ?? "") }))
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  categoriesCache = { at: Date.now(), items: list };
  return list;
}

function applyFilters(items: CatalogItem[], p: URLSearchParams) {
  const category = p.get("category") || "";
  const type = p.get("type") || "";
  const search = (p.get("search") || "").trim().toLowerCase();
  const minPrice = Number(p.get("minPrice") || "0") || 0;
  const maxPriceRaw = p.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : Infinity;
  const inStockOnly = p.get("inStockOnly") !== "false"; // default true
  const idsCsv = p.get("ids") || "";
  const ids = idsCsv ? new Set(idsCsv.split(",").map((s) => s.trim()).filter(Boolean)) : null;

  // When user is searching explicitly, always include out-of-stock so they can see it.
  const enforceStock = inStockOnly && !search && !ids;

  return items.filter((it) => {
    if (ids && !ids.has(it.id)) return false;
    if (category && it.category_id !== category) return false;
    if (type && it.product_type !== type) return false;
    if (it.final_price < minPrice || it.final_price > maxPrice) return false;
    if (enforceStock && !it.inStock) return false;
    if (search) {
      const hay = `${it.name} ${it.reference} ${it.brand} ${it.description} ${it.category}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function sortItems(items: CatalogItem[]) {
  return [...items].sort((a, b) => {
    if ((b.inStock ? 1 : 0) !== (a.inStock ? 1 : 0)) return (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0);
    return a.name.localeCompare(b.name, "es");
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";

  try {
    if (action === "categories") {
      const cats = await fetchCategories();
      return json({ categories: cats });
    }

    if (action === "get") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id required" }, 400);
      const items = await fetchAllItems();
      const item = items.find((i) => i.id === String(id));
      if (!item) return json({ error: "not_found" }, 404);
      return json({ item });
    }

    // list (and featured)
    const pageSize = Math.min(60, Math.max(1, Number(url.searchParams.get("pageSize") || "24")));
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));

    const all = await fetchAllItems();
    const filtered = applyFilters(all, url.searchParams);
    const sorted = sortItems(filtered);

    const total = sorted.length;
    const inStockTotal = sorted.filter((i) => i.inStock).length;
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return json({ items, total, inStockTotal, page, pageSize });
  } catch (e: any) {
    console.error("alegra-catalog error", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}