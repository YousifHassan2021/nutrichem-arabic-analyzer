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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error("Invalid email format");
    }

    logStep("Activating subscription", { userEmail, durationMonths });

    // Try to find user by email (optional - user might not be registered yet)
    let userId = null;
    try {
      const { data: allUsers, error: userFindError } = await supabaseClient.auth.admin.listUsers();
      if (!userFindError && allUsers) {
        const foundUser = allUsers.users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
        if (foundUser) {
          userId = foundUser.id;
          logStep("User found in system", { userId });
        } else {
          logStep("User not yet registered, creating subscription for future activation");
        }
      }
    } catch (error) {
      logStep("Error finding user (will proceed anyway)", { error });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(durationMonths));

    // Check if there's already an active subscription for this email
    const { data: existingSub } = await supabaseClient
      .from('manual_subscriptions')
      .select('id, expires_at')
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      throw new Error("هذا الإيميل لديه اشتراك نشط بالفعل. استخدم خيار التمديد بدلاً من ذلك.");
    }

    // Insert manual subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('manual_subscriptions')
      .insert({
        user_id: userId,
        user_email: userEmail.toLowerCase(),
        activated_by: adminUser.id,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        notes: notes || null
      })
      .select()
      .single();

    if (subError) throw new Error(`Error creating subscription: ${subError.message}`);

    logStep("Subscription activated", { subscriptionId: subscription.id, hasUserId: !!userId });

    return new Response(JSON.stringify({ 
      success: true,
      subscription,
      message: userId 
        ? "تم تفعيل الاشتراك بنجاح"
        : "تم إنشاء الاشتراك. سيتم تفعيله تلقائياً عندما يسجل المستخدم بهذا الإيميل"
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
