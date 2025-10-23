-- Security Fix: Restrict public access to sensitive data
-- This migration updates RLS policies to require authentication for viewing sensitive information

-- 1. Fix profiles table - Restrict PII access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Management can view all profiles" ON public.profiles
FOR SELECT USING (has_management_access(auth.uid()));

-- 2. Fix employees table - Restrict employee data
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

CREATE POLICY "Authenticated staff can view employees" ON public.employees
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'cashier'::user_role) OR 
    has_management_access(auth.uid())
  )
);

-- 3. Fix transactions table - Restrict financial data
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;

CREATE POLICY "Staff can view transactions" ON public.transactions
FOR SELECT USING (
  has_role(auth.uid(), 'cashier'::user_role) OR 
  has_management_access(auth.uid())
);

-- 4. Fix expenses table - Restrict business expenses
DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;

CREATE POLICY "Management can view expenses" ON public.expenses
FOR SELECT USING (has_management_access(auth.uid()));

-- 5. Fix rooms table - Require authentication
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;

CREATE POLICY "Authenticated users can view rooms" ON public.rooms
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. Fix user_roles table - Require authentication
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL);