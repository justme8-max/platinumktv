-- Create enum for recurring frequency
CREATE TYPE public.recurring_frequency AS ENUM ('weekly', 'monthly');

-- Create recurring_bookings table
CREATE TABLE public.recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC NOT NULL,
  frequency recurring_frequency NOT NULL,
  day_of_week INTEGER, -- 0-6 for weekly (0=Sunday)
  day_of_month INTEGER, -- 1-31 for monthly
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means no end date
  hourly_rate NUMERIC NOT NULL,
  deposit_amount NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view recurring bookings"
ON public.recurring_bookings FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create recurring bookings"
ON public.recurring_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Management can update recurring bookings"
ON public.recurring_bookings FOR UPDATE
TO authenticated
USING (has_management_access(auth.uid()));

CREATE POLICY "Management can delete recurring bookings"
ON public.recurring_bookings FOR DELETE
TO authenticated
USING (has_management_access(auth.uid()));

-- Create table for tracking sent reminders
CREATE TABLE public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders
CREATE POLICY "Staff can view reminders"
ON public.booking_reminders FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_recurring_bookings_updated_at
BEFORE UPDATE ON public.recurring_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();