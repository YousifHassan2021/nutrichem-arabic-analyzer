import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMOB-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const payload = await req.json();
    logStep("Payload received", { 
      type: payload.type,
      orderId: payload.obj?.order?.id,
      success: payload.obj?.success
    });

    // Check if payment was successful
    if (payload.type === "TRANSACTION" && payload.obj?.success === true) {
      const orderId = payload.obj.order.id.toString();
      const transactionId = payload.obj.id.toString();
      
      logStep("Payment successful", { orderId, transactionId });

      // Find the subscription record
      const { data: subscription, error: findError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (findError || !subscription) {
        logStep("Subscription not found", { orderId });
        throw new Error("Subscription record not found");
      }

      // Calculate subscription end date (3 months from now)
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);

      // Update subscription status
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_end: subscriptionEnd.toISOString(),
          paymob_transaction_id: transactionId,
        })
        .eq('order_id', orderId);

      if (updateError) {
        logStep("Update error", { error: updateError.message });
        throw updateError;
      }

      logStep("Subscription activated", { 
        orderId,
        subscriptionEnd: subscriptionEnd.toISOString()
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (payload.type === "TRANSACTION" && payload.obj?.success === false) {
      const orderId = payload.obj.order.id.toString();
      logStep("Payment failed", { orderId });

      // Update subscription status to failed
      await supabaseClient
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('order_id', orderId);

      return new Response(JSON.stringify({ success: false, reason: "Payment failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook received" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
