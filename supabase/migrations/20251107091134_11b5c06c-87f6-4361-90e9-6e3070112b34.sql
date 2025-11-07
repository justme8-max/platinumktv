-- Drop existing update policy for rooms
DROP POLICY IF EXISTS "Cashiers can update room status" ON public.rooms;

-- Create new policy: ONLY cashiers can update room status
CREATE POLICY "Only cashiers can update room status" 
ON public.rooms 
FOR UPDATE 
USING (has_role(auth.uid(), 'cashier'::user_role))
WITH CHECK (has_role(auth.uid(), 'cashier'::user_role));

-- Keep managers policy for managing rooms (INSERT, DELETE)
-- This ensures only cashiers can open/close rooms, but managers can still create/delete rooms