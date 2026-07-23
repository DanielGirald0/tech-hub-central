import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALEGRA_BASE = "https://api.alegra.com/api/v1";

type FailedProductLog = {
  reference: string;
  name: string;
  reason: string;
  timestamp: string;
};

function failedProductLine(failure: FailedProductLog): string {
  return `Ref: ${failure.reference || "Sin referencia"} | Nombre: ${failure.name || "Sin nombre"} | Motivo: ${failure.reason}`;
}

function buildFailureMessage(prefix: string, failures: FailedProductLog[]): string {
  if (failures.length === 0) return prefix;
  return `${prefix}\n\n${failures.map(failedProductLine).join("\n")}`;
}

function translateError(error: unknown): { message: string; detail: string } {
  const detail = error instanceof Error ? error.message : String(error);
  if (/idle_timeout|timeout|tiempo|150s/i.test(detail)) {
    return { message: "Error: tiempo de espera excedido al conectar con Alegra.", detail };
  }
  if (/Alegra API 400|code\":903|limite|l[ií]mite|par[aá]metro/i.test(detail)) {
    return { message: "Error en la sincronización: límite de consulta excedido o parámetro inválido.", detail };
  }
  if (/credentials|credenciales|configured/i.test(detail)) {
    return { message: "No se sincronizaron productos. Verifica configuración o credenciales.", detail };
  }
  return { message: `Error en la sincronización: ${detail}`, detail };
}

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let res: Response;
    try {
      res = await fetch(`${ALEGRA_BASE}/items?start=${start}&limit=${limit}`, {
        headers: { Authorization: auth, Accept: "application/json" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
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

function extractReference(item: any): string {
  return String(item.reference || item.code || item.sku || "").trim();
}

function extractTaxPercentage(item: any): number {
  const sources = [item.tax, item.taxes, item.price?.[0]?.tax, item.price?.[0]?.taxes].flat().filter(Boolean);
  const percentage = sources.reduce((sum: number, tax: any) => sum + Number(tax.percentage ?? tax.rate ?? tax.percent ?? 0), 0);
  return Number.isFinite(percentage) ? percentage / 100 : 0;
}

function priceIncludesTax(item: any): boolean {
  const priceRow = Array.isArray(item.price) ? item.price[0] : item.price;
  return Boolean(item.priceIncludesTax || item.taxIncluded || item.includeTax || priceRow?.taxIncluded || priceRow?.includeTax);
}

function calculatePricing(item: any): { basePrice: number; taxPercentage: number; finalPrice: number } {
  const rawPrice = extractPrice(item);
  const taxPercentage = extractTaxPercentage(item);
  const includesTax = priceIncludesTax(item);
  const safeRaw = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 0;
  const basePrice = includesTax && taxPercentage > 0 ? safeRaw / (1 + taxPercentage) : safeRaw;
  const finalPrice = includesTax ? safeRaw : basePrice * (1 + taxPercentage);
  return {
    basePrice: Math.round(basePrice),
    taxPercentage: Number((taxPercentage * 100).toFixed(2)),
    finalPrice: Math.round(finalPrice),
  };
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

// 10 years, effectively permanent
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

function guessExtension(contentType: string | null, url: string): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  const m = url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function mirrorImageToStorage(
  supabase: any,
  alegraId: string,
  sourceUrl: string,
): Promise<string> {
  if (!sourceUrl) return "";
  // Already mirrored (our own storage signed URL) — reuse
  if (sourceUrl.includes("/storage/v1/object/") && sourceUrl.includes("product-images")) {
    return sourceUrl;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(sourceUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const contentType = res.headers.get("content-type");
    const ext = guessExtension(contentType, sourceUrl);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `${alegraId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, bytes, { contentType: contentType || "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const { data: signed, error: signErr } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr || !signed?.signedUrl) throw signErr || new Error("sign failed");
    return signed.signedUrl;
  } catch (e) {
    console.error(`mirror image failed for ${alegraId}:`, e instanceof Error ? e.message : e);
    return "";
  }
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

  const startedMs = Date.now();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Admin-only guard
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("alegra_sync_log")
    .update({
      status: "error",
      message: "Error: tiempo de espera excedido al conectar con Alegra.",
      error_detail: "La sincronización anterior quedó en proceso y fue marcada como fallida para permitir reintentos.",
      finished_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("started_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  const { data: logRow } = await supabase
    .from("alegra_sync_log")
    .insert({ sync_type: "products", status: "running" })
    .select()
    .single();
  const logId = logRow?.id;

  let synced = 0;
  let failed = 0;
  const failedProducts: FailedProductLog[] = [];

  try {
    const items = await fetchAllAlegraItems();
    if (items.length === 0) throw new Error("No se sincronizaron productos. Verifica configuración o credenciales.");

    const now = new Date().toISOString();
    const payloads = items.flatMap((item) => {
      const reference = extractReference(item);
      const name = item.name || "Sin nombre";
      const fallbackReference = reference || `Sin referencia${item.id ? ` (Alegra ID: ${item.id})` : ""}`;
      try {
        if (!item.name) throw new Error("falta nombre obligatorio");
        const pricing = calculatePricing(item);
        return [{
          alegra_id: String(item.id),
          sku: reference || null,
          reference: reference || null,
          name,
          description: item.description || "",
          base_price: pricing.basePrice,
          tax_percentage: pricing.taxPercentage,
          final_price: pricing.finalPrice,
          price: pricing.finalPrice,
          stock: extractStock(item),
          image_url: extractImage(item),
          category: extractCategory(item),
          product_type: "product",
          last_synced_at: now,
          updated_at: now,
        }];
      } catch (error) {
        const reason = error instanceof Error ? error.message : "error de validación";
        failed += 1;
        failedProducts.push({ reference: fallbackReference, name, reason, timestamp: new Date().toISOString() });
        return [];
      }
    });

    if (payloads.length === 0) throw new Error("No se importaron productos porque Alegra no envió productos válidos.");

    // Mirror Alegra images to our own Storage bucket so URLs never expire.
    // Only re-download when the source URL changed from what we already have.
    const alegraIdsForMirror = payloads.map((p) => p.alegra_id);
    const { data: existingRows } = await supabase
      .from("products")
      .select("alegra_id,image_url")
      .in("alegra_id", alegraIdsForMirror);
    const existingImageByAlegraId = new Map<string, string>(
      ((existingRows || []) as any[]).map((r) => [r.alegra_id, r.image_url || ""]),
    );
    for (const p of payloads) {
      if (elapsedMs(startedMs) > 120000) break;
      const src = p.image_url;
      if (!src) continue;
      const prev = existingImageByAlegraId.get(p.alegra_id) || "";
      // Reuse previously mirrored URL when the source hasn't changed and we already stored it
      const alreadyMirrored = prev.includes("/storage/v1/object/") && prev.includes("product-images");
      if (alreadyMirrored) {
        p.image_url = prev;
        continue;
      }
      const mirrored = await mirrorImageToStorage(supabase, p.alegra_id, src);
      p.image_url = mirrored || prev || "";
    }

    const categoryNames = [...new Set(payloads.map((product) => product.category))];
    await supabase.from("categories").upsert(categoryNames.map((name) => ({ name, slug: slugify(name), active: true })), { onConflict: "slug" });
    const { data: categoryRows } = await supabase.from("categories").select("id,slug").in("slug", categoryNames.map(slugify));
    const categoryIdBySlug = new Map((categoryRows || []).map((category: any) => [category.slug, category.id]));

    // Bulk upsert in batches by alegra_id (unique index exists)
    const BATCH = 200;
    for (let i = 0; i < payloads.length; i += BATCH) {
      if (elapsedMs(startedMs) > 130000) throw new Error("timeout: tiempo de espera excedido al conectar con Alegra.");
      const chunk = payloads.slice(i, i + BATCH);
      const { error } = await supabase
        .from("products")
        .upsert(chunk, { onConflict: "alegra_id" });
      if (error) {
        console.error("Batch upsert failed", i, error.message);
        failed += chunk.length;
        chunk.forEach((product) => failedProducts.push({
          reference: product.reference || product.sku || "Sin referencia",
          name: product.name || "Sin nombre",
          reason: `error de base de datos: ${error.message}`,
          timestamp: new Date().toISOString(),
        }));
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
      const duration = elapsedMs(startedMs);
      await supabase
        .from("alegra_sync_log")
        .update({
          status: failed === 0 ? "success" : "partial",
          items_synced: synced,
          items_failed: failed,
          items_processed: items.length,
          duration_ms: duration,
          finished_at: new Date().toISOString(),
          message: failed === 0
            ? `Sincronización completada correctamente. ${synced} productos sincronizados en ${Math.round(duration / 1000)}s.`
            : buildFailureMessage(`Sincronización parcial. Total procesados: ${items.length}. Exitosos: ${synced}. Fallidos: ${failed}. Productos con error:`, failedProducts),
          error_detail: failed ? buildFailureMessage("Error al sincronizar los siguientes productos:", failedProducts) : null,
          technical_details: { total: items.length, synced, failed, failed_products: failedProducts, duration_ms: duration },
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, synced, failed, total: items.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("Sync error", e);
    const translated = translateError(e);
    const duration = elapsedMs(startedMs);
    const errorMessage = failedProducts.length > 0
      ? buildFailureMessage(translated.message, failedProducts)
      : translated.message;
    const errorDetail = failedProducts.length > 0
      ? buildFailureMessage("Error al sincronizar los siguientes productos:", failedProducts)
      : translated.detail;
    if (logId) {
      await supabase
        .from("alegra_sync_log")
        .update({
          status: "error",
          message: errorMessage,
          error_detail: errorDetail,
          finished_at: new Date().toISOString(),
          items_synced: synced,
          items_failed: failed,
          items_processed: synced + failed,
          duration_ms: duration,
          technical_details: { error: translated.detail, synced, failed, failed_products: failedProducts, duration_ms: duration },
        })
        .eq("id", logId);
    }
    return new Response(
      JSON.stringify({ success: false, error: e.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});