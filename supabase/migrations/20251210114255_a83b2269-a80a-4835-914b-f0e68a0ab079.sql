-- Drop existing policies on manual_subscriptions
DROP POLICY IF EXISTS "Admins can manage all manual subscriptions" ON public.manual_subscriptions;
DROP POLICY IF EXISTS "Users can view their own manual subscriptions" ON public.manual_subscriptions;

-- Recreate policies with explicit TO authenticated to prevent anonymous access
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
USING (auth.uid() = user_id AND user_id IS NOT NULL);