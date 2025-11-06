-- Create approval request type enum
CREATE TYPE approval_request_type AS ENUM ('discount', 'minimum_charge');

-- Create approval status enum
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create approval_requests table
CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type approval_request_type NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  reason TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_requested_by ON public.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_created_at ON public.approval_requests(created_at);

-- RLS Policies
CREATE POLICY "Staff can view approval requests"
  ON public.approval_requests
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Cashiers can create approval requests"
  ON public.approval_requests
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'cashier') 
    AND auth.uid() = requested_by
  );

CREATE POLICY "Managers can update approval requests"
  ON public.approval_requests
  FOR UPDATE
  USING (has_management_access(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for approval requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;

-- Function to process approved discount/minimum charge
CREATE OR REPLACE FUNCTION public.apply_approval_to_transaction(
  p_approval_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get the approval request
  SELECT * INTO v_request
  FROM public.approval_requests
  WHERE id = p_approval_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update transaction based on request type
  IF v_request.transaction_id IS NOT NULL THEN
    IF v_request.request_type = 'discount' THEN
      -- Apply discount to transaction
      UPDATE public.transactions
      SET 
        final_amount = GREATEST(0, final_amount - v_request.amount),
        updated_at = now()
      WHERE id = v_request.transaction_id;
    ELSIF v_request.request_type = 'minimum_charge' THEN
      -- Apply minimum charge to transaction
      UPDATE public.transactions
      SET 
        final_amount = final_amount + v_request.amount,
        updated_at = now()
      WHERE id = v_request.transaction_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;