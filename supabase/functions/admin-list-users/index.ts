import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-LIST-USERS] ${step}${detailsStr}`);
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

    // Get all users
    const { data: allUsers, error: usersError } = await supabaseClient.auth.admin.listUsers();
    if (usersError) throw new Error("Error fetching users");

    // Get manual subscriptions
    const { data: manualSubs, error: manualSubsError } = await supabaseClient
      .from('manual_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (manualSubsError) {
      logStep("Error fetching manual subscriptions", { error: manualSubsError });
    }

    // Get Stripe subscriptions
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const usersWithStatus = await Promise.all(
      allUsers.users.map(async (user) => {
        let subscriptionStatus = 'none';
        let subscriptionSource = null;
        let expiresAt = null;
        let subscriptionId = null;

        // Check manual subscription
        const manualSub = manualSubs?.find(sub => sub.user_id === user.id);
        if (manualSub && manualSub.status === 'active') {
          const expiry = new Date(manualSub.expires_at);
          if (expiry > new Date()) {
            subscriptionStatus = 'active';
            subscriptionSource = 'manual';
            expiresAt = manualSub.expires_at;
            subscriptionId = manualSub.id;
          }
        }

        // Check Stripe subscription if no manual sub
        if (subscriptionStatus === 'none' && user.email) {
          try {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
              const subscriptions = await stripe.subscriptions.list({
                customer: customers.data[0].id,
                status: 'active',
                limit: 1,
              });
              if (subscriptions.data.length > 0) {
                subscriptionStatus = 'active';
                subscriptionSource = 'stripe';
                expiresAt = new Date(subscriptions.data[0].current_period_end * 1000).toISOString();
              }
            }
          } catch (error) {
            logStep("Error checking Stripe subscription", { email: user.email, error });
          }
        }

        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          subscriptionStatus,
          subscriptionSource,
          expiresAt,
          subscriptionId
        };
      })
    );

    logStep("Users fetched", { count: usersWithStatus.length });

    return new Response(JSON.stringify({ 
      users: usersWithStatus
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
