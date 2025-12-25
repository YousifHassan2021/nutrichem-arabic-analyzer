import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXTEND-STRIPE-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const { subscriptionId, additionalMonths, deviceId } = await req.json();
    logStep("Request received", { subscriptionId, additionalMonths, deviceId });

    if (!subscriptionId || !additionalMonths) {
      throw new Error("Missing required parameters: subscriptionId and additionalMonths");
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

    // Get current subscription from Stripe
    logStep("Fetching Stripe subscription");
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep("Subscription retrieved", { 
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end 
    });

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      throw new Error("Subscription is not active");
    }

    // Calculate new expiration date
    const currentEnd = subscription.current_period_end 
      ? subscription.current_period_end 
      : Math.floor(Date.now() / 1000);
    
    const additionalSeconds = parseInt(additionalMonths) * 30 * 24 * 60 * 60;
    const newPeriodEnd = currentEnd + additionalSeconds;

    logStep("Extending subscription", { 
      currentEnd,
      additionalMonths,
      newPeriodEnd: new Date(newPeriodEnd * 1000).toISOString() 
    });
    
    // Update subscription with trial_end to effectively extend it
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      trial_end: newPeriodEnd,
      proration_behavior: 'none',
    });

    logStep("Subscription extended successfully", { 
      newTrialEnd: updatedSubscription.trial_end 
    });

    // Update local database
    const newExpiresAt = new Date(newPeriodEnd * 1000).toISOString();
    await supabaseClient
      .from("device_subscriptions")
      .update({ expires_at: newExpiresAt })
      .eq("stripe_subscription_id", subscriptionId);

    return new Response(JSON.stringify({ 
      success: true, 
      newExpiresAt,
      message: "تم تمديد الاشتراك بنجاح"
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
