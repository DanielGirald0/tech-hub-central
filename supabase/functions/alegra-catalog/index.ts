// Alegra catalog proxy: single source of truth for products. Talks directly
// to https://api.alegra.com/api/v1/items using its native pagination, search
// (query) and category (idItemCategory) params. No product data is ever
// stored locally; a short in-memory cache (per edge instance) softens
// repeated calls without hiding upstream changes for long.
// Public function (verify_jwt = false).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALEGRA_BASE = "https://api.alegra.com/api/v1";
const ALEGRA_MAX_LIMIT = 30; // Alegra caps every response at 30 rows.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min cache — reduces upstream latency notably.
const CATEGORIES_TTL_MS = 30 * 60 * 1000;

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

// Small per-instance cache keyed by request signature.
const responseCache = new Map<string, { at: number; body: unknown }>();
let categoriesCache: { at: number; items: Array<{ id: string; name: string }> } | null = null;

function cacheGet(key: string, ttl = CACHE_TTL_MS) {
  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.body;
  if (hit) responseCache.delete(key);
  return null;
}
function cacheSet(key: string, body: unknown) {
  responseCache.set(key, { at: Date.now(), body });
  // Cheap eviction to keep the map small per instance.
  if (responseCache.size > 200) {
    const first = responseCache.keys().next().value;
    if (first) responseCache.delete(first);
  }
}

async function alegraFetch(path: string): Promise<any> {
  const maxAttempts = 6;
  let lastErr = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${ALEGRA_BASE}${path}`, {
      headers: { Authorization: alegraAuth(), Accept: "application/json" },
    });
    if (res.ok) return await res.json();
    const body = await res.text();
    lastErr = `${res.status}: ${body.slice(0, 200)}`;
    // Retry on rate limiting / transient upstream errors with exponential backoff.
    if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
      const retryHeader = res.headers.get("retry-after");
      const retrySeconds = Number(retryHeader);
      const retryDate = retryHeader && !Number.isFinite(retrySeconds)
        ? Math.max(0, Date.parse(retryHeader) - Date.now())
        : 0;
      const serverDelay = Number.isFinite(retrySeconds) ? retrySeconds * 1000 : retryDate;
      const exponentialDelay = Math.min(10000, 750 * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 400);
      const wait = Math.max(serverDelay, exponentialDelay) + jitter;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    break;
  }
  throw new Error(`Alegra ${path} → ${lastErr}`);
}

// Featured products are curated manually by admins in public.featured_products.
const FEATURED_TTL_MS = 60 * 1000;

async function fetchFeaturedIds(): Promise<string[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !key) return [];
  const res = await fetch(
    `${supabaseUrl}/rest/v1/featured_products?select=alegra_id,position&order=position.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    console.error("featured_products read failed", res.status, await res.text());
    return [];
  }
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r: any) => String(r.alegra_id));
}

async function featuredItems(url: URL) {
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit") || "8")));
  const cacheKey = `featured:${limit}`;
  const cached = cacheGet(cacheKey, FEATURED_TTL_MS);
  if (cached) return cached;

  const ids = (await fetchFeaturedIds()).slice(0, limit);
  const items: CatalogItem[] = [];
  for (const id of ids) {
    try {
      const out = await getItem(id);
      if (out?.item) items.push(out.item);
    } catch (e) {
      console.error("featured item fetch failed", id, e);
    }
  }

  const body = { items };
  cacheSet(cacheKey, body);
  return body;
}

function buildItemsUrl(params: {
  start: number;
  limit: number;
  query?: string;
  idItemCategory?: string;
  type?: string;
  order_field?: string;
  order_direction?: string;
  status?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("start", String(params.start));
  qs.set("limit", String(params.limit));
  qs.set("order_field", params.order_field || "name");
  qs.set("order_direction", params.order_direction || "ASC");
  if (params.query) qs.set("query", params.query);
  if (params.idItemCategory) qs.set("idItemCategory", params.idItemCategory);
  if (params.type) qs.set("type", params.type);
  if (params.status) qs.set("status", params.status);
  return `/items?${qs.toString()}`;
}

async function fetchCategories() {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_TTL_MS) {
    return categoriesCache.items;
  }
  try {
    const data = await alegraFetch("/item-categories");
    const arr: any[] = Array.isArray(data) ? data : (data?.data || []);
    const list = arr
      .map((c) => ({ id: String(c.id), name: String(c.name ?? "") }))
      .filter((c) => c.name)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    categoriesCache = { at: Date.now(), items: list };
    return list;
  } catch (e) {
    console.error("alegra-catalog categories error", e);
    return categoriesCache?.items || [];
  }
}

/**
 * List products using Alegra's native pagination. Because Alegra does not
 * expose price / stock filters, we stream additional batches (still 30 max
 * each) until we fill the requested pageSize or upstream runs out.
 */
async function listItems(url: URL) {
  const pageSize = Math.min(ALEGRA_MAX_LIMIT, Math.max(1, Number(url.searchParams.get("pageSize") || "24")));
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const search = (url.searchParams.get("search") || "").trim();
  const category = url.searchParams.get("category") || "";
  const type = url.searchParams.get("type") || "";
  const minPrice = Number(url.searchParams.get("minPrice") || "0") || 0;
  const maxPriceRaw = url.searchParams.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : Infinity;
  const inStockOnly = url.searchParams.get("inStockOnly") !== "false";
  // If the user searches explicitly, out-of-stock results MUST be visible.
  const enforceStock = inStockOnly && !search;

  const cacheKey = JSON.stringify({ a: "list", page, pageSize, search, category, type, minPrice, maxPrice, enforceStock });
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const needed = page * pageSize; // fetch enough to serve the requested page
  const collected: CatalogItem[] = [];
  let upstreamExhausted = false;

  // Safety cap on how many upstream batches we walk per request.
  const MAX_BATCHES = 20;
  const hasLocalFilter = enforceStock || minPrice > 0 || maxPrice !== Infinity;
  // If we don't need to filter locally we can jump straight to the offset.
  const startOffset = hasLocalFilter ? 0 : (page - 1) * pageSize;
  const targetCollected = hasLocalFilter ? needed + pageSize : pageSize;
  const initialBatches = Math.min(
    MAX_BATCHES,
    Math.max(1, Math.ceil(targetCollected / ALEGRA_MAX_LIMIT)),
  );

  const fetchBatch = async (batchIdx: number) => {
    const path = buildItemsUrl({
      start: startOffset + batchIdx * ALEGRA_MAX_LIMIT,
      limit: ALEGRA_MAX_LIMIT,
      query: search || undefined,
      idItemCategory: category || undefined,
      type: type === "product" || type === "service" ? type : undefined,
    });
    const data = await alegraFetch(path);
    return Array.isArray(data) ? data : (data?.data || []);
  };

  // Fire the first wave with limited concurrency to avoid Alegra 429s.
  const CONCURRENCY = 3;
  const firstWave: any[][] = new Array(initialBatches);
  for (let i = 0; i < initialBatches; i += CONCURRENCY) {
    const slice = await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, initialBatches - i) }, (_, k) => fetchBatch(i + k)),
    );
    for (let k = 0; k < slice.length; k++) firstWave[i + k] = slice[k];
  }
  let batchesRun = initialBatches;
  for (const batch of firstWave) {
    if (batch.length === 0) { upstreamExhausted = true; continue; }
    for (const raw of batch) {
      const it = mapItem(raw);
      if (enforceStock && !it.inStock) continue;
      if (it.final_price < minPrice || it.final_price > maxPrice) continue;
      collected.push(it);
    }
    if (batch.length < ALEGRA_MAX_LIMIT) upstreamExhausted = true;
  }

  // If local filters dropped many rows, top up sequentially (rare case).
  while (
    hasLocalFilter &&
    collected.length < needed + pageSize &&
    !upstreamExhausted &&
    batchesRun < MAX_BATCHES
  ) {
    const batch = await fetchBatch(batchesRun);
    batchesRun += 1;
    if (batch.length === 0) { upstreamExhausted = true; break; }
    for (const raw of batch) {
      const it = mapItem(raw);
      if (enforceStock && !it.inStock) continue;
      if (it.final_price < minPrice || it.final_price > maxPrice) continue;
      collected.push(it);
    }
    if (batch.length < ALEGRA_MAX_LIMIT) { upstreamExhausted = true; break; }
  }

  const sliceStart = hasLocalFilter ? (page - 1) * pageSize : 0;
  const items = collected.slice(sliceStart, sliceStart + pageSize);
  // hasMore is true when we could not confirm end of upstream, or when we
  // already have more collected items than the current page consumes.
  const hasMore = collected.length > sliceStart + pageSize || !upstreamExhausted;
  const body = { items, page, pageSize, hasMore };
  cacheSet(cacheKey, body);
  return body;
}

async function getItem(id: string) {
  const cacheKey = `get:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const data = await alegraFetch(`/items/${encodeURIComponent(id)}`);
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw?.id) return null;
  const item = mapItem(raw);
  cacheSet(cacheKey, { item });
  return { item };
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
      const out = await getItem(id);
      if (!out) return json({ error: "not_found" }, 404);
      return json(out);
    }
    if (action === "featured") {
      return json(await featuredItems(url));
    }
    // Default action: list (also used for featured / related).
    const body = await listItems(url);
    return json(body);
  } catch (e: any) {
    console.error("alegra-catalog error", e);
    const message = e?.message || String(e);
    const status = message.includes("→ 429:") ? 503 : 500;
    return json({ error: message }, status, status === 503 ? { "Retry-After": "10" } : undefined);
  }
});

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}