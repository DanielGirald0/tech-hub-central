import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

async function fetchAllAlegraItems(): Promise<any[]> {
  const auth = alegraAuth();
  const all: any[] = [];
  let start = 0;
  const limit = 30;
  while (true) {
    const res = await fetch(`${ALEGRA_BASE}/items?start=${start}&limit=${limit}`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Alegra API ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const items: any[] = Array.isArray(data) ? data : (data.data || []);
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < limit) break;
    start += limit;
    if (start > 10000) break; // safety cap
  }
  return all;
}

function extractPrice(item: any): number {
  if (Array.isArray(item.price) && item.price.length > 0) {
    const p = item.price[0];
    return Number(p.price ?? p.value ?? 0);
  }
  return Number(item.price ?? 0);
}

function extractStock(item: any): number {
  if (item.inventory?.availableQuantity !== undefined) return Number(item.inventory.availableQuantity);
  if (item.inventory?.quantity !== undefined) return Number(item.inventory.quantity);
  return 0;
}

function extractImage(item: any): string {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0].url || item.images[0].link || "";
  }
  return "";
}

function extractCategory(item: any): string {
  if (item.category?.name) return String(item.category.name);
  if (item.itemCategory?.name) return String(item.itemCategory.name);
  return "General";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "general";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: logRow } = await supabase
    .from("alegra_sync_log")
    .insert({ sync_type: "products", status: "running" })
    .select()
    .single();
  const logId = logRow?.id;

  let synced = 0;
  let failed = 0;

  try {
    const items = await fetchAllAlegraItems();

    const now = new Date().toISOString();
    const payloads = items.map((item) => ({
      alegra_id: String(item.id),
      sku: item.reference || String(item.id),
      name: item.name || "Sin nombre",
      description: item.description || "",
      price: extractPrice(item),
      stock: extractStock(item),
      image_url: extractImage(item),
      category: extractCategory(item),
      product_type: "product",
      last_synced_at: now,
      updated_at: now,
    }));

    const categoryNames = [...new Set(items.map(extractCategory))];
    await supabase.from("categories").upsert(categoryNames.map((name) => ({ name, slug: slugify(name), active: true })), { onConflict: "slug" });
    const { data: categoryRows } = await supabase.from("categories").select("id,slug").in("slug", categoryNames.map(slugify));
    const categoryIdBySlug = new Map((categoryRows || []).map((category: any) => [category.slug, category.id]));

    // Bulk upsert in batches by alegra_id (unique index exists)
    const BATCH = 200;
    for (let i = 0; i < payloads.length; i += BATCH) {
      const chunk = payloads.slice(i, i + BATCH);
      const { error } = await supabase
        .from("products")
        .upsert(chunk, { onConflict: "alegra_id" });
      if (error) {
        console.error("Batch upsert failed", i, error.message);
        failed += chunk.length;
      } else {
        synced += chunk.length;
      }
    }

    const alegraIds = payloads.map((product) => product.alegra_id);
    const { data: syncedProducts } = await supabase.from("products").select("id,alegra_id,category").in("alegra_id", alegraIds);
    const links = ((syncedProducts || []) as any[])
      .map((product) => ({ product_id: product.id, category_id: categoryIdBySlug.get(slugify(product.category)) }))
      .filter((link) => Boolean(link.category_id));
    if (links.length > 0) await supabase.from("product_categories").upsert(links, { onConflict: "product_id,category_id" });

    if (logId) {
      await supabase
        .from("alegra_sync_log")
        .update({
          status: failed === 0 ? "success" : "partial",
          items_synced: synced,
          items_failed: failed,
          finished_at: new Date().toISOString(),
          message: `Synced ${synced} products${failed ? `, ${failed} failed` : ""}`,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, synced, failed, total: items.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("Sync error", e);
    if (logId) {
      await supabase
        .from("alegra_sync_log")
        .update({
          status: "error",
          message: e.message || String(e),
          finished_at: new Date().toISOString(),
          items_synced: synced,
          items_failed: failed,
        })
        .eq("id", logId);
    }
    return new Response(
      JSON.stringify({ success: false, error: e.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});