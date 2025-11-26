import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LINK-DEVICE-SUB] ${step}${detailsStr}`);
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

    const { deviceId, email } = await req.json();
    logStep("Request received", { deviceId, email });

    if (!deviceId || !email) {
      throw new Error("Device ID and email are required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "لم يتم العثور على عميل بهذا البريد الإلكتروني" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customer = customers.data[0];
    logStep("Found customer", { customerId: customer.id });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscriptions found");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "لم يتم العثور على اشتراك نشط لهذا البريد" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const subscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: subscription.id });

    // Check if device already has a subscription
    const { data: existingSub } = await supabaseClient
      .from('device_subscriptions')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existingSub) {
      logStep("Device already has subscription", { existingSubId: existingSub.id });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "هذا الجهاز مرتبط باشتراك بالفعل" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Calculate expiration
    const expiresAt = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    // Insert into device_subscriptions
    const { data: newSub, error: insertError } = await supabaseClient
      .from('device_subscriptions')
      .insert({
        device_id: deviceId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error inserting subscription", { error: insertError.message });
      throw insertError;
    }

    logStep("Successfully linked subscription", { subscriptionId: newSub.id });

    return new Response(JSON.stringify({
      success: true,
      message: "تم ربط الاشتراك بنجاح!",
      subscription: {
        id: newSub.id,
        expires_at: newSub.expires_at,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
