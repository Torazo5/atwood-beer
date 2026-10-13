import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (request.method === "GET") {
    const { data, error } = await admin
      .from("beer_counter")
      .select("total")
      .eq("id", 1)
      .single();

    if (error) return json({ error: "Could not load the beer count." }, 500);
    return json({ total: Number(data.total) });
  }

  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const { amount, password } = await request.json().catch(() => ({}));
  if (password !== "beer") return json({ error: "That password isn't it." }, 401);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return json({ error: "Pick a whole number that fits the tally." }, 400);
  }

  const { data, error } = await admin.rpc("add_beers", { p_amount: amount });
  if (error) return json({ error: "Could not add those beers." }, 500);

  return json({ total: Number(data) });
});
