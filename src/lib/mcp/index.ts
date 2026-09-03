import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyRepairOrders from "./tools/get-my-repair-orders";

// Build the OAuth issuer from the project ref (inlined by Vite at build time,
// import-safe for cold starts). The direct supabase.co host is required — the
// runtime SUPABASE_URL may be a proxy that mcp-js will reject.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tecno-gz-mcp",
  title: "Tecno Gz",
  version: "0.1.0",
  instructions:
    "Tools for Tecno Gz customers and staff. Use `get_my_repair_orders` to read the signed-in user's service/repair orders. All authenticated tools respect the app's row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyRepairOrders],
});