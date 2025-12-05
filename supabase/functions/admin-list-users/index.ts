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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Parse request body for deviceId
    const { deviceId } = await req.json().catch(() => ({}));
    
    // Admin emails list
    const adminEmails = ['yuosif_74@hotmail.com'];
    let isAdmin = false;
    
    // Method 1: Check via JWT if available
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer " + Deno.env.get("SUPABASE_ANON_KEY")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (!userError && userData.user) {
          logStep("User authenticated via JWT", { userId: userData.user.id });
          
          // Check if user is admin in user_roles table
          const { data: roles } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userData.user.id)
            .eq('role', 'admin')
            .single();

          if (roles) {
            isAdmin = true;
            logStep("Admin verified via user_roles");
          }
        }
      } catch (e) {
        logStep("JWT auth failed, trying device-based auth");
      }
    }
    
    // Method 2: Check via deviceId subscription email
    if (!isAdmin && deviceId) {
      logStep("Checking admin via deviceId", { deviceId });
      
      const { data: deviceSub } = await supabaseClient
        .from('device_subscriptions')
        .select('stripe_customer_id')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (deviceSub?.stripe_customer_id) {
        try {
          const customer = await stripe.customers.retrieve(deviceSub.stripe_customer_id);
          if (!('deleted' in customer) && customer.email) {
            const email = customer.email.toLowerCase();
            if (adminEmails.includes(email)) {
              isAdmin = true;
              logStep("Admin verified via device subscription email", { email });
            }
          }
        } catch (e) {
          logStep("Error fetching Stripe customer", { error: e });
        }
      }
    }
    
    if (!isAdmin) {
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

    // Stripe client already initialized above

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
            // Calculate expiry as 3 months from subscription creation
            const createdDate = new Date(sub.created_at);
            const expiryDate = new Date(createdDate);
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            let expiresAt = expiryDate.toISOString();
            
            // Check if subscription is still active based on expiry
            const now = new Date();
            let subscriptionStatus = expiryDate > now && sub.status === 'active' ? 'active' : 'expired';
            let subscriptionSource = 'device';
            let subscriptionId = sub.stripe_subscription_id || sub.id;

            // Keep the calculated 3-month expiry, but verify status with Stripe
            if (sub.stripe_subscription_id) {
              try {
                const subscription = await stripe.subscriptions.retrieve(
                  sub.stripe_subscription_id,
                );
                // If Stripe says it's canceled or inactive, update status
                if (subscription.status !== 'active') {
                  subscriptionStatus = 'expired';
                }
                subscriptionSource = 'stripe';
                logStep("Successfully verified Stripe subscription for device", {
                  subscriptionId: sub.stripe_subscription_id,
                  expiresAt,
                  stripeStatus: subscription.status,
                  finalStatus: subscriptionStatus
                });
              } catch (error) {
                logStep("Error fetching Stripe subscription for device", {
                  subscriptionId: sub.stripe_subscription_id,
                  error: error instanceof Error ? error.message : String(error),
                });
                // Keep the calculated expiry and status
                subscriptionSource = 'stripe';
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
