-- Create device_subscriptions table to track device-specific subscriptions
CREATE TABLE IF NOT EXISTS public.device_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for device checking)
CREATE POLICY "Allow public read access to device subscriptions"
ON public.device_subscriptions
FOR SELECT
USING (true);

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage device subscriptions"
ON public.device_subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for faster device_id lookups
CREATE INDEX idx_device_subscriptions_device_id ON public.device_subscriptions(device_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_device_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_device_subscriptions_updated_at
BEFORE UPDATE ON public.device_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_device_subscriptions_updated_at();