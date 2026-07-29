export interface CatalogProduct {
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
}

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  type?: "" | "product" | "service";
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callCatalog(qs: URLSearchParams) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/alegra-catalog?${qs.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (!res.ok) throw new Error(`catalog ${res.status}: ${await res.text()}`);
  return (await res.json()) as any;
}

export async function listProducts(params: ListParams = {}) {
  const qs = new URLSearchParams();
  qs.set("action", "list");
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.category) qs.set("category", params.category);
  if (params.type) qs.set("type", params.type);
  if (params.search) qs.set("search", params.search);
  if (params.minPrice != null) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));
  if (params.inStockOnly === false) qs.set("inStockOnly", "false");
  const res = await callCatalog(qs);
  return {
    items: (res?.items || []) as CatalogProduct[],
    page: Number(res?.page || 1),
    pageSize: Number(res?.pageSize || 24),
    hasMore: Boolean(res?.hasMore),
  };
}

export async function getProduct(id: string): Promise<CatalogProduct | null> {
  const qs = new URLSearchParams({ action: "get", id });
  const res = await callCatalog(qs);
  return (res?.item as CatalogProduct) || null;
}

export async function listCategories(): Promise<CatalogCategory[]> {
  const qs = new URLSearchParams({ action: "categories" });
  const res = await callCatalog(qs);
  return (res?.categories || []) as CatalogCategory[];
}

export async function listFeatured(limit = 8): Promise<CatalogProduct[]> {
  // Pull a broad sample across the alphabet (Alegra returns items sorted
  // alphabetically, so page 1 is all "A"). We fetch several pages in parallel
  // to get letter variety, then prioritize items with an image and diversify
  // by first letter.
  const pages = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map((p) =>
      listProducts({ pageSize: 30, page: p }).catch(() => ({ items: [] as CatalogProduct[], hasMore: false }))
    )
  );
  const all: CatalogProduct[] = pages.flatMap((p) => p.items);
  const withImage = all.filter((p) => p.image_url);
  const pool = withImage.length >= limit ? withImage : [...withImage, ...all.filter((p) => !p.image_url)];
  return diversifyByLetter(pool, limit);
}

function diversifyByLetter(list: CatalogProduct[], limit: number): CatalogProduct[] {
  const buckets = new Map<string, CatalogProduct[]>();
  for (const p of list) {
    const letter = (p.name?.trim()[0] || "#").toUpperCase();
    if (!buckets.has(letter)) buckets.set(letter, []);
    buckets.get(letter)!.push(p);
  }
  const result: CatalogProduct[] = [];
  const seen = new Set<string>();
  // First pass: one product per distinct letter.
  for (const [letter, arr] of buckets) {
    if (result.length >= limit) break;
    result.push(arr[0]);
    seen.add(arr[0].id);
  }
  // Fill remaining slots with the rest, preserving original order.
  if (result.length < limit) {
    for (const p of list) {
      if (result.length >= limit) break;
      if (!seen.has(p.id)) {
        result.push(p);
        seen.add(p.id);
      }
    }
  }
  return result;
}