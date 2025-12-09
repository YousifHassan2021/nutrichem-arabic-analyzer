-- Fix RLS policies on manual_subscriptions to explicitly require authenticated users
DROP POLICY IF EXISTS "Admins can manage all manual subscriptions" ON public.manual_subscriptions;
DROP POLICY IF EXISTS "Users can view their own manual subscriptions" ON public.manual_subscriptions;

-- Recreate policies with explicit 'to authenticated'
CREATE POLICY "Admins can manage all manual subscriptions" 
ON public.manual_subscriptions 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own manual subscriptions" 
ON public.manual_subscriptions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix RLS policy on device_subscriptions to use 'to service_role' instead of checking JWT claims
DROP POLICY IF EXISTS "Allow service role only" ON public.device_subscriptions;

-- Only service_role should access this table (via edge functions)
CREATE POLICY "Allow service role only" 
ON public.device_subscriptions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);