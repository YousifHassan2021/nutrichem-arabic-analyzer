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

    const { deviceId, email: rawEmail } = await req.json();
    
    // Normalize email: trim and lowercase
    const email = rawEmail?.trim().toLowerCase();
    
    logStep("Request received", { deviceId, emailProvided: !!email });

    if (!deviceId || !email) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Device ID and email are required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logStep("Invalid email format");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Invalid email format" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Find customer by email - try exact match first
    logStep("Searching for customer in Stripe", { email });
    let customers = await stripe.customers.list({ email, limit: 10 });
    logStep("Stripe search results", { count: customers.data.length });
    
    // If no exact match, try searching all customers and filter
    if (customers.data.length === 0) {
      logStep("No exact match, searching all customers");
      const allCustomers = await stripe.customers.list({ limit: 100 });
      logStep("All customers count", { count: allCustomers.data.length });
      
      // Filter by email manually
      customers.data = allCustomers.data.filter((c: Stripe.Customer) => 
        c.email?.toLowerCase().trim() === email
      );
      logStep("After manual filter", { count: customers.data.length });
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found after all attempts");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "لم يتم العثور على عميل بهذا البريد الإلكتروني في Stripe. تأكد من إكمال عملية الدفع أولاً." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customer = customers.data[0];
    logStep("Found customer", { customerId: customer.id });

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

    // Try to find an active Stripe subscription first
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    let expiresAt: string | null = null;
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let status = "active";

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      logStep("Found active Stripe subscription", { subscriptionId: subscription.id });

      expiresAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      stripeCustomerId = customer.id;
      stripeSubscriptionId = subscription.id;
      status = subscription.status;
    } else {
      // If no active Stripe subscription, fallback to manual subscriptions
      logStep("No active Stripe subscriptions found, checking manual_subscriptions");

      const { data: manualSub, error: manualError } = await supabaseClient
        .from('manual_subscriptions')
        .select('*')
        .eq('user_email', email)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .maybeSingle();

      if (manualError) {
        logStep("Error fetching manual subscription", { error: manualError.message });
        throw manualError;
      }

      if (!manualSub) {
        logStep("No active subscriptions found (Stripe or manual)");
        return new Response(JSON.stringify({ 
          success: false, 
          message: "لم يتم العثور على اشتراك نشط لهذا البريد" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      expiresAt = manualSub.expires_at;
      status = manualSub.status || 'active';
      stripeCustomerId = null;
      stripeSubscriptionId = null;

      logStep("Found active manual subscription", { manualSubscriptionId: manualSub.id, expiresAt });
    }

    // Insert into device_subscriptions
    const { data: newSub, error: insertError } = await supabaseClient
      .from('device_subscriptions')
      .insert({
        device_id: deviceId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status,
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
