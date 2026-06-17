// Supabase Edge Function: payment-webhook
// -----------------------------------------------------------------------------
// Recibe la confirmacion de pago de una PASARELA (Culqi, Izipay, Niubiz,
// Mercado Pago, o "Yape para Empresas") y marca el pedido como 'pagado'.
//
// IMPORTANTE: Yape/BCP NO tienen un webhook publico para cuentas personales.
// Esta funcion es el punto de entrada para cuando contrates una pasarela real.
//
// Desplegar (con la CLI de Supabase):
//   supabase functions deploy payment-webhook --no-verify-jwt
//   supabase secrets set WEBHOOK_SECRET=tu_secreto SERVICE_ROLE_KEY=tu_service_role
// Luego configura esa URL como "webhook"/"callback" en tu pasarela:
//   https://mohbirhrtbgilwtuxdcu.supabase.co/functions/v1/payment-webhook
// -----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// service_role: SOLO en el servidor (Edge Function). Nunca en el navegador.
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 1) Verifica un secreto compartido (ajusta segun la firma real de tu pasarela)
  const secret = req.headers.get("x-webhook-secret");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2) Lee el cuerpo. Adapta estos campos al formato de tu pasarela.
  let body: any = {};
  try { body = await req.json(); } catch { /* vacio */ }

  const orderId = body.order_id ?? body.external_reference ?? body.ref;
  const status  = (body.status ?? "").toLowerCase();
  const authCode = body.authorization_code ?? body.operation_code ?? null;

  if (!orderId) {
    return new Response(JSON.stringify({ ok: false, error: "missing order_id" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // 3) Mapea el estado de la pasarela a tu enum (pendiente | pagado | rechazado)
  const paid = ["paid", "approved", "success", "completed", "pagado"].includes(status);
  const newStatus = paid ? "pagado" : (status === "rejected" ? "rechazado" : "pendiente");

  // 4) Actualiza el pedido (service_role salta RLS de forma segura en el servidor)
  const { error } = await admin
    .from("orders")
    .update({ status: newStatus, authorization_code: authCode })
    .eq("id", orderId);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, order: orderId, status: newStatus }), {
    headers: { "Content-Type": "application/json" },
  });
});
