-- Create employees table
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id text NOT NULL UNIQUE,
  name text NOT NULL,
  division text NOT NULL,
  phone text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Everyone can view employees
CREATE POLICY "Anyone can view employees"
  ON public.employees
  FOR SELECT
  USING (true);

-- Managers and owners can create employees
CREATE POLICY "Managers can create employees"
  ON public.employees
  FOR INSERT
  WITH CHECK (has_management_access(auth.uid()));

-- Managers and owners can update employees
CREATE POLICY "Managers can update employees"
  ON public.employees
  FOR UPDATE
  USING (has_management_access(auth.uid()));

-- Only owners can delete employees
CREATE POLICY "Owners can delete employees"
  ON public.employees
  FOR DELETE
  USING (has_role(auth.uid(), 'owner'));

-- Add trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to generate employee ID based on name and division
CREATE OR REPLACE FUNCTION public.generate_employee_id(emp_name text, emp_division text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  name_length integer;
  division_length integer;
  initials text;
  division_code text;
  result_number numeric;
BEGIN
  -- Remove spaces and count letters in name
  name_length := length(regexp_replace(emp_name, '[^A-Za-z]', '', 'g'));
  
  -- Count letters in division
  division_length := length(regexp_replace(emp_division, '[^A-Za-z]', '', 'g'));
  
  -- Get initials from name (first letter of each word)
  SELECT string_agg(substring(word, 1, 1), '')
  INTO initials
  FROM regexp_split_to_table(emp_name, '\s+') AS word;
  
  -- Get division code (first 3 letters)
  division_code := upper(substring(emp_division, 1, 3));
  
  -- Calculate the division result
  IF division_length > 0 THEN
    result_number := round((name_length::numeric / division_length::numeric), 2);
  ELSE
    result_number := name_length;
  END IF;
  
  -- Format: INITIALS-NAMELENGTH/DIVISIONLENGTH-DIVCODE
  -- Example: NK-15/7-MAN (Neni Kurniawati, 15 letters / 7 letters, Manager)
  RETURN upper(initials) || '-' || name_length || '/' || division_length || '-' || division_code;
END;
$$;