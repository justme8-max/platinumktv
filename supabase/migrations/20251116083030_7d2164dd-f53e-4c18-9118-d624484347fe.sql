-- Enable realtime for fb_orders table
ALTER TABLE public.fb_orders REPLICA IDENTITY FULL;

-- Add fb_orders to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_orders;

-- Enable realtime for rooms table  
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

-- Add rooms to realtime publication (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;
END $$;