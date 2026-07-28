import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List products from the Tecno Gz catalog (sourced live from Alegra). Optionally filter by a search term (matches name/reference/brand) and limit the number of results.",
  inputSchema: {
    search: z.string().trim().max(100).optional().describe("Optional search term matched against product name, reference or brand."),
    limit: z.number().int().min(1).max(50).optional().describe("Max number of products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }) => {
    const projectRef = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] || "";
    const url = new URL(`${process.env.SUPABASE_URL}/functions/v1/alegra-catalog`);
    url.searchParams.set("action", "list");
    url.searchParams.set("pageSize", String(limit ?? 20));
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("inStockOnly", "false");
    const res = await fetch(url.toString(), {
      headers: {
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY || "",
        Authorization: `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY || ""}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { content: [{ type: "text", text: `catalog error ${res.status}: ${text}` }], isError: true };
    }
    const data = await res.json();
    const products = (data?.items || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.final_price ?? p.price,
      stock: p.stock,
      reference: p.reference,
    }));
    void projectRef;
    return {
      content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
      structuredContent: { products },
    };
  },
});