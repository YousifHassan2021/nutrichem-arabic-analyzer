import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-STRIPE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { subscriptionId, deviceId, cancelImmediately = false } = await req.json();
    logStep("Request received", { subscriptionId, deviceId, cancelImmediately });

    if (!subscriptionId) {
      throw new Error("Missing required parameter: subscriptionId");
    }

    // Verify admin access via device subscription
    if (deviceId) {
      const { data: subData } = await supabaseClient
        .from("device_subscriptions")
        .select("stripe_customer_id")
        .eq("device_id", deviceId)
        .eq("status", "active")
        .single();

      if (!subData) {
        throw new Error("Unauthorized: No active subscription found for this device");
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    logStep("Cancelling Stripe subscription");
    
    let cancelledSubscription;
    if (cancelImmediately) {
      // Cancel immediately
      cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      logStep("Subscription cancelled immediately");
    } else {
      // Cancel at period end
      cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      logStep("Subscription set to cancel at period end");
    }

    // Update local database
    const newStatus = cancelImmediately ? "cancelled" : "cancelling";
    await supabaseClient
      .from("device_subscriptions")
      .update({ status: newStatus })
      .eq("stripe_subscription_id", subscriptionId);

    return new Response(JSON.stringify({ 
      success: true,
      status: cancelledSubscription.status,
      cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
      message: cancelImmediately 
        ? "تم إلغاء الاشتراك فوراً" 
        : "سيتم إلغاء الاشتراك في نهاية الفترة الحالية"
    }), {
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
