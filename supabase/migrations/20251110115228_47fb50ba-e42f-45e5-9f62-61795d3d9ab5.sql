-- Create draft_registrations table for autosaving registration form data
CREATE TABLE IF NOT EXISTS public.draft_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  division TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.draft_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update their own draft (by email)
CREATE POLICY "Anyone can create draft registrations"
ON public.draft_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update draft registrations by email"
ON public.draft_registrations
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can view draft registrations by email"
ON public.draft_registrations
FOR SELECT
USING (true);