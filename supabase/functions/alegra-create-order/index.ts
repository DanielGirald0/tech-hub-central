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

async function findOrCreateContact(customer: { name: string; email: string; phone?: string; address?: string; documentType?: string; documentNumber?: string }) {
  const auth = alegraAuth();
  const docNumber = (customer.documentNumber || "").trim();
  const docType = customer.documentType === "NIT" ? "NIT" : "CC";

  // Search by document number first, then by email
  const queries = [docNumber, customer.email].filter(Boolean);
  for (const q of queries) {
    const search = await fetch(`${ALEGRA_BASE}/contacts?query=${encodeURIComponent(q)}`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!search.ok) continue;
    const data = await search.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    const found = list.find((c: any) => {
      const idNum = c.identification?.number || c.identification || c.identificationObject?.number;
      return (
        (docNumber && String(idNum || "") === docNumber) ||
        (c.email || "").toLowerCase() === customer.email.toLowerCase()
      );
    });
    if (found) return found.id;
  }
  // Create
  const body: any = {
    name: customer.name,
    email: customer.email,
    type: ["client"],
    identification: { type: docType, number: docNumber || String(Date.now()) },
  };
  if (customer.phone) body.mobile = customer.phone;
  if (customer.address) body.address = { address: customer.address, city: { name: "Rionegro", department: { name: "Antioquia" }, country: "Colombia" } };

  const res = await fetch(`${ALEGRA_BASE}/contacts`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Alegra contact create failed: ${await res.text()}`);
  const created = await res.json();
  return created.id;
}

async function createInvoice(
  contactId: number | string,
  items: Array<{ alegra_id?: string; name: string; price: number; quantity: number }>,
  invoiceType: "normal" | "electronica" = "normal",
) {
  const auth = alegraAuth();
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const body: any = {
    date: today,
    dueDate,
    client: contactId,
    items: items.map((it) => ({
      id: it.alegra_id ? Number(it.alegra_id) : undefined,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    })),
  };
  if (invoiceType === "electronica") {
    body.stamp = { generateStamp: true };
  }

  const res = await fetch(`${ALEGRA_BASE}/invoices`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Alegra invoice create failed: ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { customer, items, delivery } = await req.json();
    if (!customer?.name || !customer?.email || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get auth user (optional)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "");
      const { data } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id || null;
    }

    // Resolve product info from db (price authoritative)
    const productIds = items.map((i: any) => i.id);
    const { data: dbProducts } = await supabase.from("products").select("id, name, price, stock, alegra_id").in("id", productIds);

    const enrichedItems = items.map((i: any) => {
      const p = (dbProducts || []).find((dp: any) => dp.id === i.id);
      return {
        product_id: i.id,
        alegra_id: p?.alegra_id,
        name: p?.name || i.name,
        price: Number(p?.price ?? i.price),
        quantity: Number(i.quantity || 1),
        stock: Number(p?.stock ?? 0),
      };
    });

    // Stock check
    const insufficient = enrichedItems.find((i) => i.stock < i.quantity);
    if (insufficient) {
      return new Response(JSON.stringify({ error: `Stock insuficiente para ${insufficient.name}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryType = delivery?.type === "domicilio" ? "domicilio" : "tienda";
    const deliveryCost = deliveryType === "domicilio" ? Math.max(10000, Number(delivery?.cost ?? 10000)) : 0;
    const total = subtotal + deliveryCost;

    // 1. Create local order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: userId,
        total_price: total,
        subtotal,
        delivery_type: deliveryType,
        delivery_cost: deliveryCost,
        status: "pendiente de pago",
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || "",
        customer_address: customer.address || "",
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    // 2. Order items
    const orderItemsRows = enrichedItems.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.price,
    }));
    await supabase.from("order_items").insert(orderItemsRows);

    // 3. Decrement local stock
    for (const i of enrichedItems) {
      await supabase.from("products").update({ stock: i.stock - i.quantity }).eq("id", i.product_id);
    }

    // 4. Push to Alegra (best-effort)
    let invoiceId: string | null = null;
    let invoiceNumber: string | null = null;
    let alegraError: string | null = null;
    try {
      const contactId = await findOrCreateContact(customer);
      const invoice = await createInvoice(contactId, enrichedItems, customer.invoiceType === "electronica" ? "electronica" : "normal");
      invoiceId = String(invoice.id);
      invoiceNumber = String(invoice.numberTemplate?.fullNumber || invoice.number || invoice.id);
      await supabase.from("orders").update({
        alegra_invoice_id: invoiceId,
        alegra_invoice_number: invoiceNumber,
      }).eq("id", order.id);
    } catch (e: any) {
      console.error("Alegra invoice push failed:", e);
      alegraError = e.message || String(e);
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      total,
      alegra_invoice_id: invoiceId,
      alegra_invoice_number: invoiceNumber,
      alegra_error: alegraError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("create-order error", e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});