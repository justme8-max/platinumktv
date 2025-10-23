-- Create role enum
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier');

-- Create room status enum
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM ('room_rental', 'food_beverage', 'other');

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'ewallet', 'transfer');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL, -- 'small', 'medium', 'large', 'vip'
  capacity INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  status room_status DEFAULT 'available',
  current_session_start TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  description TEXT,
  session_start TIMESTAMPTZ,
  session_end TIMESTAMPTZ,
  duration_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to check if user has any management role
CREATE OR REPLACE FUNCTION has_management_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'manager')
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view user roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only owners can manage roles" ON user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'));

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage rooms" ON rooms FOR ALL TO authenticated USING (has_management_access(auth.uid()));
CREATE POLICY "Cashiers can update room status" ON rooms FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'cashier'));

-- RLS Policies for transactions
CREATE POLICY "Anyone can view transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashiers and managers can create transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'cashier') OR has_management_access(auth.uid())
);
CREATE POLICY "Managers can update transactions" ON transactions FOR UPDATE TO authenticated USING (has_management_access(auth.uid()));
CREATE POLICY "Owners can delete transactions" ON transactions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner'));

-- RLS Policies for expenses
CREATE POLICY "Anyone can view expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can create expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (has_management_access(auth.uid()));
CREATE POLICY "Managers can update expenses" ON expenses FOR UPDATE TO authenticated USING (has_management_access(auth.uid()));
CREATE POLICY "Owners can delete expenses" ON expenses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'owner'));

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();