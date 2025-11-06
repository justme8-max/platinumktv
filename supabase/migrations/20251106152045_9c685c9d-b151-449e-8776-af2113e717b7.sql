-- Fix search_path security issue for calculate_transaction_total function
DROP FUNCTION IF EXISTS public.calculate_transaction_total(NUMERIC, NUMERIC, NUMERIC);

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
SECURITY DEFINER
SET search_path = public
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