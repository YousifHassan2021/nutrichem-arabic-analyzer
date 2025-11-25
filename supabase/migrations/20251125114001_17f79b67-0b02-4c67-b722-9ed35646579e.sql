-- Make user_id nullable in manual_subscriptions to allow pre-registration subscriptions
ALTER TABLE public.manual_subscriptions 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_email 
ON public.manual_subscriptions(user_email) 
WHERE status = 'active';