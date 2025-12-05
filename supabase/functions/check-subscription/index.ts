import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const { deviceId, includeEmail } = await req.json();
    logStep("Device ID received", { deviceId });

    if (!deviceId) {
      throw new Error("Device ID is required");
    }

    // Check device_subscriptions table
    logStep("Checking device subscriptions");
    const { data: deviceSub, error: deviceSubError } = await supabaseClient
      .from('device_subscriptions')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .maybeSingle();

    if (deviceSubError) {
      logStep("Error checking device subscriptions", { error: deviceSubError.message });
    }

    if (deviceSub) {
      // Calculate expiry as 3 months from subscription creation
      const createdDate = new Date(deviceSub.created_at);
      const expiryDate = new Date(createdDate);
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      const subscriptionEnd = expiryDate.toISOString();
      
      // Check if subscription is still active based on expiry
      const now = new Date();
      const isExpired = expiryDate <= now;
      
      logStep("Active device subscription found", { 
        subscriptionId: deviceSub.stripe_subscription_id,
        createdAt: deviceSub.created_at,
        calculatedExpiresAt: subscriptionEnd,
        isExpired
      });

      // If expired, return not subscribed
      if (isExpired) {
        logStep("Device subscription has expired");
        return new Response(JSON.stringify({ subscribed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get product_id and optionally email from Stripe
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
        apiVersion: "2025-08-27.basil" 
      });

      let productId = null;
      let email = null;
      
      if (deviceSub.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(deviceSub.stripe_subscription_id);
          productId = subscription.items.data[0].price.product as string;
          logStep("Retrieved product ID from Stripe", { productId });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logStep("Error retrieving Stripe subscription", { error: errorMsg });
        }
      }
      
      // Get email from Stripe customer if requested
      if (includeEmail && deviceSub.stripe_customer_id) {
        try {
          const customer = await stripe.customers.retrieve(deviceSub.stripe_customer_id);
          if (!('deleted' in customer) && customer.email) {
            email = customer.email;
            logStep("Retrieved email from Stripe customer", { email });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logStep("Error retrieving Stripe customer", { error: errorMsg });
        }
      }

      const response: any = {
        subscribed: true,
        product_id: productId,
        subscription_end: subscriptionEnd
      };
      
      if (includeEmail && email) {
        response.email = email;
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No active device subscription found");
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
