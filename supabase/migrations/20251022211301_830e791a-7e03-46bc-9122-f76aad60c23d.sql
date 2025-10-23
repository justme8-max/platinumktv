-- Update the handle_new_user function to assign 'owner' role to first user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- If first user, make them owner, otherwise make them cashier by default
  IF user_count = 1 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'owner');
  ELSE
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'cashier');
  END IF;
  
  RETURN NEW;
END;
$$;