-- Add waiter assignment to rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES profiles(id);

-- Add waiter assignment tracking
CREATE TABLE IF NOT EXISTS public.waiter_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(room_id, waiter_id, status)
);

ALTER TABLE public.waiter_assignments ENABLE ROW LEVEL SECURITY;

-- RLS for waiter assignments
CREATE POLICY "Anyone can view waiter assignments"
  ON public.waiter_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can manage waiter assignments"
  ON public.waiter_assignments FOR ALL
  USING (has_management_access(auth.uid()));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_waiter_assignments_room ON waiter_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_waiter_assignments_waiter ON waiter_assignments(waiter_id);