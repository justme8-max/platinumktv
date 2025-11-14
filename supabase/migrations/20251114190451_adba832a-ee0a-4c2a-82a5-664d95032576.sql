-- Create cash drawers table for cash management
CREATE TABLE IF NOT EXISTS public.cash_drawers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC,
  total_cash_in NUMERIC NOT NULL DEFAULT 0,
  total_cash_out NUMERIC NOT NULL DEFAULT 0,
  cash_difference NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create cash drawer transactions table
CREATE TABLE IF NOT EXISTS public.cash_drawer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawer_id UUID NOT NULL REFERENCES public.cash_drawers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cash_drawers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_drawer_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cash_drawers
CREATE POLICY "Users can view their own drawers"
  ON public.cash_drawers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drawers"
  ON public.cash_drawers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawers"
  ON public.cash_drawers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Management can view all drawers"
  ON public.cash_drawers
  FOR SELECT
  TO authenticated
  USING (has_management_access(auth.uid()));

-- RLS Policies for cash_drawer_transactions
CREATE POLICY "Users can view their drawer transactions"
  ON public.cash_drawer_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cash_drawers
      WHERE id = cash_drawer_transactions.drawer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions for their drawers"
  ON public.cash_drawer_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cash_drawers
      WHERE id = cash_drawer_transactions.drawer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Management can view all transactions"
  ON public.cash_drawer_transactions
  FOR SELECT
  TO authenticated
  USING (has_management_access(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_cash_drawers_user_id ON public.cash_drawers(user_id);
CREATE INDEX idx_cash_drawers_status ON public.cash_drawers(status);
CREATE INDEX idx_cash_drawer_transactions_drawer_id ON public.cash_drawer_transactions(drawer_id);