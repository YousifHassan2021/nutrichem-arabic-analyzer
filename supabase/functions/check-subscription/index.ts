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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check for manual subscription by user_id if user exists
    if (user.id) {
      const { data: manualSub, error: manualSubError } = await supabaseClient
        .from('manual_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!manualSubError && manualSub) {
        const expiresAt = new Date(manualSub.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          logStep("Active manual subscription found by user_id", { 
            subscriptionId: manualSub.id, 
            expiresAt: manualSub.expires_at 
          });
          
          return new Response(JSON.stringify({
            subscribed: true,
            product_id: 'manual_subscription',
            subscription_end: manualSub.expires_at
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // Also check by email (for subscriptions created before user registration)
    if (user.email) {
      const { data: manualSubByEmail, error: manualSubByEmailError } = await supabaseClient
        .from('manual_subscriptions')
        .select('*')
        .eq('user_email', user.email.toLowerCase())
        .eq('status', 'active')
        .single();

      if (!manualSubByEmailError && manualSubByEmail) {
        const expiresAt = new Date(manualSubByEmail.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          // Link subscription to user if not already linked
          if (!manualSubByEmail.user_id && user.id) {
            await supabaseClient
              .from('manual_subscriptions')
              .update({ user_id: user.id })
              .eq('id', manualSubByEmail.id);
            
            logStep("Linked subscription to registered user", { 
              subscriptionId: manualSubByEmail.id,
              userId: user.id
            });
          }

          logStep("Active manual subscription found by email", { 
            subscriptionId: manualSubByEmail.id, 
            expiresAt: manualSubByEmail.expires_at 
          });
          
          return new Response(JSON.stringify({
            subscribed: true,
            product_id: 'manual_subscription',
            subscription_end: manualSubByEmail.expires_at
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    logStep("No active manual subscription, checking Stripe");

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Raw subscription data", { 
        id: subscription.id, 
        current_period_end: subscription.current_period_end,
        status: subscription.status 
      });
      
      // Validate and convert the timestamp
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (dateError) {
          logStep("Date conversion error", { 
            error: dateError instanceof Error ? dateError.message : String(dateError),
            timestamp: subscription.current_period_end 
          });
          subscriptionEnd = null;
        }
      }
      
      productId = subscription.items.data[0]?.price?.product ?? null;
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
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
