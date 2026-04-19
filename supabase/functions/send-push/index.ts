import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PushRequest = {
  profile_ids: string[];
  title: string;
  body: string;
  url?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const publicKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY") ?? "";
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hola@mostacho.app";

    if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey) {
      throw new Error("Faltan variables de entorno para enviar notificaciones.");
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = (await request.json()) as PushRequest;
    if (!body.profile_ids?.length) {
      return Response.json(
        { sent: 0, skipped: 0, errors: ["No se recibieron profile_ids."] },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, keys, profile_id")
      .in("profile_id", body.profile_ids);

    if (error) {
      throw error;
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys as {
              auth: string;
              p256dh: string;
            },
          },
          JSON.stringify({
            title: body.title,
            body: body.body,
            url: body.url ?? "/",
          }),
        );
        sent += 1;
      } catch (sendError) {
        skipped += 1;
        errors.push(
          sendError instanceof Error
            ? sendError.message
            : "Error desconocido al enviar push.",
        );
      }
    }

    return Response.json({ sent, skipped, errors }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Error inesperado.",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
