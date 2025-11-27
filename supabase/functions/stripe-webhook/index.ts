import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Webhook request received", { 
    method: req.method,
    hasSignature: !!req.headers.get("stripe-signature")
  });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("ERROR: No signature found in request");
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    logStep("Request body received", { bodyLength: body.length });
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      logStep("ERROR: No webhook secret configured in environment");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    logStep("Constructing webhook event");
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event constructed successfully", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const deviceId = session.metadata?.device_id;

        logStep("Processing checkout.session.completed", {
          sessionId: session.id,
          deviceId,
          customerId: session.customer,
          subscriptionId: session.subscription,
          hasMetadata: !!session.metadata,
          metadata: session.metadata
        });

        if (!deviceId) {
          logStep("WARNING: No device_id in session metadata, cannot link subscription");
          break;
        }

        if (!session.subscription) {
          logStep("WARNING: No subscription ID in session, skipping");
          break;
        }

        // Get subscription details from Stripe to get accurate expiration
        logStep("Fetching subscription details from Stripe");
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        const expiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        logStep("Subscription details retrieved", {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          expiresAt
        });

        // حفظ أو تحديث معلومات الاشتراك في الجدول
        const { data: insertedData, error: upsertError } = await supabaseClient
          .from("device_subscriptions")
          .upsert({
            device_id: deviceId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: subscription.status,
            expires_at: expiresAt,
          }, {
            onConflict: "device_id"
          })
          .select();

        if (upsertError) {
          logStep("ERROR saving subscription to database", { 
            error: upsertError.message,
            details: upsertError 
          });
        } else {
          logStep("Subscription saved successfully to database", { 
            data: insertedData 
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        logStep("Processing subscription update/delete", {
          subscriptionId: subscription.id,
          status: subscription.status
        });

        // تحديث حالة الاشتراك
        const { error: updateError } = await supabaseClient
          .from("device_subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : "inactive",
            expires_at: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          logStep("Error updating subscription", { error: updateError });
        } else {
          logStep("Subscription updated successfully");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
