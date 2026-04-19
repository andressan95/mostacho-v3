import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase.rpc("close_due_raffles");

    if (error) {
      throw error;
    }

    return Response.json(
      { closed_raffles: data ?? 0 },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Error inesperado.",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
