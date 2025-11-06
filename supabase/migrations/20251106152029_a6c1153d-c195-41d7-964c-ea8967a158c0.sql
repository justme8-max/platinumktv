-- Create tax settings table for PPN
CREATE TABLE public.tax_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_type TEXT NOT NULL DEFAULT 'ppn', -- ppn, service_charge
  rate NUMERIC NOT NULL DEFAULT 11, -- PPN standard rate 11%
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT[] DEFAULT ARRAY['room_rental', 'product_sale']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add tax columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN subtotal NUMERIC,
ADD COLUMN tax_amount NUMERIC DEFAULT 0,
ADD COLUMN tax_rate NUMERIC DEFAULT 11,
ADD COLUMN service_charge NUMERIC DEFAULT 0,
ADD COLUMN final_amount NUMERIC;

-- Enable RLS
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_settings
CREATE POLICY "Everyone can view tax settings"
  ON public.tax_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage tax settings"
  ON public.tax_settings FOR ALL
  USING (has_role(auth.uid(), 'owner'::user_role));

-- Insert default PPN setting
INSERT INTO public.tax_settings (name, tax_type, rate, is_active, applies_to)
VALUES 
  ('PPN 11%', 'ppn', 11, true, ARRAY['room_rental', 'product_sale']),
  ('Service Charge 5%', 'service_charge', 5, false, ARRAY['room_rental', 'product_sale']);

-- Create function to calculate tax
CREATE OR REPLACE FUNCTION public.calculate_transaction_total(
  p_subtotal NUMERIC,
  p_tax_rate NUMERIC DEFAULT 11,
  p_service_charge_rate NUMERIC DEFAULT 0
)
RETURNS TABLE(
  subtotal NUMERIC,
  tax_amount NUMERIC,
  service_charge NUMERIC,
  final_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tax_amount NUMERIC;
  v_service_charge NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- Calculate service charge on subtotal
  v_service_charge := ROUND(p_subtotal * (p_service_charge_rate / 100), 0);
  
  -- Calculate PPN on subtotal + service charge
  v_tax_amount := ROUND((p_subtotal + v_service_charge) * (p_tax_rate / 100), 0);
  
  -- Calculate final amount
  v_final_amount := p_subtotal + v_service_charge + v_tax_amount;
  
  RETURN QUERY SELECT 
    p_subtotal,
    v_tax_amount,
    v_service_charge,
    v_final_amount;
END;
$$;

-- Create index for better performance
CREATE INDEX idx_tax_settings_active ON public.tax_settings(is_active) WHERE is_active = true;