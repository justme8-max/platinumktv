-- Fix security warning: Set search_path for generate_employee_id function
CREATE OR REPLACE FUNCTION public.generate_employee_id(emp_name text, emp_division text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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
  RETURN upper(initials) || '-' || name_length || '/' || division_length || '-' || division_code;
END;
$$;