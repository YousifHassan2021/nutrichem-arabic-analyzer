import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-MANUAL-SUB] ${step}${detailsStr}`);
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

    const { userEmail, durationMonths, notes } = await req.json();
    if (!userEmail || !durationMonths) {
      throw new Error("User email and duration are required");
    }

    logStep("Activating subscription", { userEmail, durationMonths });

    // Find user by email
    const { data: targetUser, error: userFindError } = await supabaseClient.auth.admin.listUsers();
    if (userFindError) throw new Error("Error finding users");
    
    const foundUser = targetUser.users.find(u => u.email === userEmail);
    if (!foundUser) throw new Error("User not found with this email");

    logStep("Target user found", { userId: foundUser.id });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(durationMonths));

    // Insert manual subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('manual_subscriptions')
      .insert({
        user_id: foundUser.id,
        user_email: userEmail,
        activated_by: adminUser.id,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        notes: notes || null
      })
      .select()
      .single();

    if (subError) throw new Error(`Error creating subscription: ${subError.message}`);

    logStep("Subscription activated", { subscriptionId: subscription.id });

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
