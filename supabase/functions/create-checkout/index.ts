import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    
    const body = await req.json();
    const email = body.email;
    if (!email) throw new Error("Email is required");
    
    logStep("User authenticated", { userId: user.id, email });

    const apiKey = Deno.env.get("PAYMOB_API_KEY");
    const integrationId = Deno.env.get("PAYMOB_INTEGRATION_ID");
    const iframeId = Deno.env.get("PAYMOB_IFRAME_ID");
    
    if (!apiKey || !integrationId || !iframeId) {
      throw new Error("Paymob credentials not configured");
    }

    // Step 1: Get authentication token
    logStep("Getting Paymob auth token");
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const authData = await authResponse.json();
    const authToken = authData.token;
    logStep("Got auth token");

    // Step 2: Register order
    logStep("Registering order");
    const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "false",
        amount_cents: "1000", // 10 SAR = 1000 halalas
        currency: "SAR",
        items: [{
          name: "اشتراك ربع سنوي",
          amount_cents: "1000",
          description: "اشتراك ماعون لمدة 3 أشهر",
          quantity: "1"
        }]
      }),
    });
    const orderData = await orderResponse.json();
    const orderId = orderData.id;
    logStep("Order registered", { orderId });

    // Step 3: Get payment key
    logStep("Getting payment key");
    const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: "1000",
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: email,
          floor: "NA",
          first_name: user.email?.split('@')[0] || "User",
          street: "NA",
          building: "NA",
          phone_number: "NA",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "SA",
          last_name: "User",
          state: "NA"
        },
        currency: "SAR",
        integration_id: parseInt(integrationId),
      }),
    });
    const paymentKeyData = await paymentKeyResponse.json();
    const paymentKey = paymentKeyData.token;
    logStep("Got payment key");

    // Create subscription record in database
    const { error: dbError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        order_id: orderId.toString(),
        amount_cents: 1000,
        currency: 'SAR',
        status: 'pending'
      });

    if (dbError) {
      logStep("Database error", { error: dbError.message });
    }

    // Build iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
    logStep("Checkout URL created", { url: iframeUrl });

    return new Response(JSON.stringify({ url: iframeUrl }), {
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
