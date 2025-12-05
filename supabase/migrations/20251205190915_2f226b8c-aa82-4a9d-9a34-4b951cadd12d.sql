-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read access to device subscriptions" ON public.device_subscriptions;

-- Create a more restrictive policy - only service role can read all records
-- Regular users should use edge functions to check their subscription status
CREATE POLICY "Service role has full access to device subscriptions" 
ON public.device_subscriptions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Fix mutable search_path on update_device_subscriptions_updated_at function
CREATE OR REPLACE FUNCTION public.update_device_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;