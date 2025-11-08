-- Create task management tables for cleaning assignments
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  status task_status NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for cleaning tasks
CREATE POLICY "Staff can view cleaning tasks"
  ON cleaning_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can create cleaning tasks"
  ON cleaning_tasks FOR INSERT
  WITH CHECK (has_management_access(auth.uid()) OR has_role(auth.uid(), 'cashier'));

CREATE POLICY "Management and assigned staff can update tasks"
  ON cleaning_tasks FOR UPDATE
  USING (
    has_management_access(auth.uid()) 
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Management can delete tasks"
  ON cleaning_tasks FOR DELETE
  USING (has_management_access(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_cleaning_tasks_updated_at
  BEFORE UPDATE ON cleaning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create F&B orders table for waiter POS
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');

CREATE TABLE IF NOT EXISTS fb_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  waiter_id UUID NOT NULL REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fb_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES fb_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE fb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for F&B orders
CREATE POLICY "Staff can view fb_orders"
  ON fb_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Waiters can create orders"
  ON fb_orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (has_role(auth.uid(), 'waiter') OR has_role(auth.uid(), 'cashier') OR has_management_access(auth.uid()))
  );

CREATE POLICY "Waiters and management can update orders"
  ON fb_orders FOR UPDATE
  USING (
    waiter_id = auth.uid() 
    OR has_management_access(auth.uid())
  );

-- Policies for F&B order items
CREATE POLICY "Staff can view fb_order_items"
  ON fb_order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Waiters can create order items"
  ON fb_order_items FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT waiter_id FROM fb_orders WHERE id = order_id
    )
    OR has_management_access(auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_fb_orders_updated_at
  BEFORE UPDATE ON fb_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add indexes for performance
CREATE INDEX idx_cleaning_tasks_room ON cleaning_tasks(room_id);
CREATE INDEX idx_cleaning_tasks_assigned_to ON cleaning_tasks(assigned_to);
CREATE INDEX idx_cleaning_tasks_status ON cleaning_tasks(status);
CREATE INDEX idx_fb_orders_room ON fb_orders(room_id);
CREATE INDEX idx_fb_orders_waiter ON fb_orders(waiter_id);
CREATE INDEX idx_fb_orders_status ON fb_orders(status);