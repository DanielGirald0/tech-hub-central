import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List products from the Tecno Gz catalog. Optionally filter by a search term (matches name/brand) and limit the number of results.",
  inputSchema: {
    search: z.string().trim().max(100).optional().describe("Optional search term matched against product name or brand."),
    limit: z.number().int().min(1).max(50).optional().describe("Max number of products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx: ToolContext) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: ctx.isAuthenticated()
          ? { headers: { Authorization: `Bearer ${ctx.getToken()}` } }
          : undefined,
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    let query = supabase
      .from("products")
      .select("id, name, brand, category, price, stock, reference")
      .limit(limit ?? 20);
    if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});