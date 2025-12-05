-- Drop duplicate policies
DROP POLICY IF EXISTS "Service role can manage device subscriptions" ON public.device_subscriptions;
DROP POLICY IF EXISTS "Service role has full access to device subscriptions" ON public.device_subscriptions;

-- Create a single policy that allows service role full access
-- Note: Edge functions with service_role key bypass RLS entirely, 
-- so this policy is mainly for the anon key prevention
CREATE POLICY "Allow service role only" 
ON public.device_subscriptions 
FOR ALL 
USING (
  -- This is a placeholder that always returns false for anon key
  -- Service role key bypasses RLS entirely
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR auth.role() = 'service_role'
);