import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXTEND-MANUAL-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: adminUser.id });

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (rolesError || !roles) {
      throw new Error("Unauthorized: User is not an admin");
    }

    logStep("Admin verified");

    const { subscriptionId, additionalMonths } = await req.json();
    if (!subscriptionId || !additionalMonths) {
      throw new Error("Subscription ID and additional months are required");
    }

    logStep("Extending subscription", { subscriptionId, additionalMonths });

    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabaseClient
      .from('manual_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError) throw new Error(`Error fetching subscription: ${fetchError.message}`);

    // Calculate new expiry date
    const currentExpiry = new Date(currentSub.expires_at);
    const now = new Date();
    
    // If already expired or current, extend from now, otherwise from current expiry
    const baseDate = currentExpiry > now ? currentExpiry : now;
    baseDate.setMonth(baseDate.getMonth() + parseInt(additionalMonths));

    // Update subscription
    const { data: subscription, error: updateError } = await supabaseClient
      .from('manual_subscriptions')
      .update({ 
        expires_at: baseDate.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) throw new Error(`Error extending subscription: ${updateError.message}`);

    logStep("Subscription extended", { 
      subscriptionId: subscription.id,
      newExpiryDate: subscription.expires_at 
    });

    return new Response(JSON.stringify({ 
      success: true,
      subscription
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
