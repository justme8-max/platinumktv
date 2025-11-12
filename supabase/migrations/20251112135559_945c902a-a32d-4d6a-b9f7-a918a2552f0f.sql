-- Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Add receipt_number to transactions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN receipt_number TEXT UNIQUE;
  END IF;
END $$;

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date TEXT;
  v_counter INTEGER;
  v_receipt_number TEXT;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the count of transactions today
  SELECT COUNT(*) + 1 INTO v_counter
  FROM public.transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  
  v_receipt_number := 'RCP-' || v_date || '-' || LPAD(v_counter::TEXT, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- Enhance shifts table with more tracking
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shifts' 
    AND column_name = 'total_sales'
  ) THEN
    ALTER TABLE public.shifts 
    ADD COLUMN total_sales NUMERIC DEFAULT 0,
    ADD COLUMN total_discount NUMERIC DEFAULT 0,
    ADD COLUMN cash_difference NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Create audit log for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only management can view audit logs
CREATE POLICY "Management can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_management_access(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name, record_id);

COMMENT ON TABLE public.notifications IS 'Real-time notifications for users';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for security and compliance';