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

    // Build status for authenticated users
    const usersWithStatus = await Promise.all(
      allUsers.users.map(async (user) => {
        let subscriptionStatus = 'none';
        let subscriptionSource = null;
        let expiresAt = null;
        let subscriptionId = null;

        // Check manual subscription
        const manualSub = manualSubs?.find((sub) => sub.user_id === user.id);
        if (manualSub && manualSub.status === 'active' && manualSub.expires_at) {
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
                const subscription = subscriptions.data[0];
                subscriptionStatus = 'active';
                subscriptionSource = 'stripe';
                expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
                subscriptionId = subscription.id;
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
          subscriptionId,
        };
      })
    );

    // Add manual subscriptions without user_id (pending registrations)
    const pendingManualSubs =
      manualSubs?.filter((sub) => !sub.user_id && sub.status === 'active') || [];
    const pendingUsers = pendingManualSubs.map((sub) => {
      const expiry = sub.expires_at ? new Date(sub.expires_at) : null;
      const isActive = expiry ? expiry > new Date() : true;

      return {
        id: sub.id,
        email: sub.user_email,
        created_at: sub.created_at,
        subscriptionStatus: isActive ? 'active' : 'none',
        subscriptionSource: 'manual',
        expiresAt: sub.expires_at,
        subscriptionId: sub.id,
      };
    });

    // Include device-based subscriptions (Stripe or manual linked to devices)
    const { data: deviceSubs, error: deviceSubsError } = await supabaseClient
      .from('device_subscriptions')
      .select('*');

    if (deviceSubsError) {
      logStep("Error fetching device subscriptions", { error: deviceSubsError });
    }

    const deviceUsers = deviceSubs
      ? await Promise.all(
          deviceSubs.map(async (sub) => {
            let email = null;
            let expiresAt = sub.expires_at;
            let subscriptionStatus = sub.status === 'active' ? 'active' : 'none';
            let subscriptionSource = 'device';
            let subscriptionId = sub.stripe_subscription_id || sub.id;

            // Refresh expiry from Stripe if we have a Stripe subscription id
            if (sub.stripe_subscription_id) {
              try {
                const subscription = await stripe.subscriptions.retrieve(
                  sub.stripe_subscription_id,
                );
                expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
                subscriptionStatus = subscription.status === 'active' ? 'active' : 'none';
              } catch (error) {
                logStep("Error fetching Stripe subscription for device", {
                  subscriptionId: sub.stripe_subscription_id,
                  error,
                });
              }
            }

            // Try to get email from Stripe customer
            if (sub.stripe_customer_id) {
              try {
                const customer = await stripe.customers.retrieve(sub.stripe_customer_id);
                if (!('deleted' in customer) && customer.email) {
                  email = customer.email;
                }
              } catch (error) {
                logStep("Error fetching Stripe customer for device", {
                  customerId: sub.stripe_customer_id,
                  error,
                });
              }
            }

            return {
              id: sub.device_id,
              email,
              created_at: sub.created_at,
              subscriptionStatus,
              subscriptionSource,
              expiresAt,
              subscriptionId,
            };
          }),
        )
      : [];

    const allUsersWithStatus = [...usersWithStatus, ...pendingUsers, ...deviceUsers];
    logStep("Users fetched", { count: allUsersWithStatus.length });

    return new Response(JSON.stringify({ 
      users: allUsersWithStatus
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
