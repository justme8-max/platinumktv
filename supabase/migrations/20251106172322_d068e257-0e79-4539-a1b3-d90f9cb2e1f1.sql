-- Update the handle_new_user trigger to assign roles based on demo email patterns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role user_role;
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Determine role based on email
  IF NEW.email LIKE 'demo-owner%' THEN
    assigned_role := 'owner';
  ELSIF NEW.email LIKE 'demo-manager%' THEN
    assigned_role := 'manager';
  ELSIF NEW.email LIKE 'demo-cashier%' THEN
    assigned_role := 'cashier';
  ELSIF NEW.email LIKE 'demo-waiter%' THEN
    assigned_role := 'waiter';
  ELSIF NEW.email LIKE 'demo-accountant%' THEN
    assigned_role := 'accountant';
  ELSE
    -- Check if this is the first user
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- If first user, make them owner, otherwise make them cashier by default
    IF user_count = 1 THEN
      assigned_role := 'owner';
    ELSE
      assigned_role := 'cashier';
    END IF;
  END IF;
  
  -- Insert the role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$function$;