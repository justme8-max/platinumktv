-- Create shifts table for shift management
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC,
  total_transactions INTEGER DEFAULT 0,
  total_cash NUMERIC DEFAULT 0,
  total_card NUMERIC DEFAULT 0,
  total_transfer NUMERIC DEFAULT 0,
  total_ewallet NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Policies for shifts
CREATE POLICY "Users can view their own shifts"
  ON public.shifts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts"
  ON public.shifts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Management can view all shifts"
  ON public.shifts
  FOR SELECT
  USING (has_management_access(auth.uid()));

-- Create index for performance
CREATE INDEX idx_shifts_user_status ON public.shifts(user_id, status);
CREATE INDEX idx_shifts_start_time ON public.shifts(start_time DESC);