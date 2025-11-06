-- Add HRD role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hrd';

-- Add comment for clarity
COMMENT ON TYPE user_role IS 'Available user roles: owner, manager, cashier, waiter, waitress, accountant, hrd';