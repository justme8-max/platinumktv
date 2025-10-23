-- Add new roles to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waiter';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waitress';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';

-- Create categories table for products
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_id TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fnb', 'merchandise', 'service')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table (F&B and other items)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_id TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_id TEXT,
  description_en TEXT,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  cost NUMERIC NOT NULL CHECK (cost >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create purchase_orders table
CREATE TYPE purchase_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  supplier_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status purchase_status DEFAULT 'pending',
  notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_items table (tracks what was sold in each transaction)
CREATE TABLE IF NOT EXISTS public.sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stock_movements table for audit trail
CREATE TYPE movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return');

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can manage categories" ON public.categories
  FOR ALL USING (has_management_access(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Everyone can view active products" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Management can view all products" ON public.products
  FOR SELECT USING (has_management_access(auth.uid()));

CREATE POLICY "Management can manage products" ON public.products
  FOR ALL USING (has_management_access(auth.uid()));

-- RLS Policies for purchase_orders
CREATE POLICY "Staff can view purchase orders" ON public.purchase_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can create purchase orders" ON public.purchase_orders
  FOR INSERT WITH CHECK (has_management_access(auth.uid()));

CREATE POLICY "Owners can approve purchase orders" ON public.purchase_orders
  FOR UPDATE USING (has_role(auth.uid(), 'owner'::user_role));

CREATE POLICY "Management can manage purchase orders" ON public.purchase_orders
  FOR ALL USING (has_management_access(auth.uid()));

-- RLS Policies for purchase_order_items
CREATE POLICY "Staff can view purchase items" ON public.purchase_order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can manage purchase items" ON public.purchase_order_items
  FOR ALL USING (has_management_access(auth.uid()));

-- RLS Policies for sales_items
CREATE POLICY "Staff can view sales items" ON public.sales_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create sales items" ON public.sales_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Management can manage sales items" ON public.sales_items
  FOR ALL USING (has_management_access(auth.uid()));

-- RLS Policies for stock_movements
CREATE POLICY "Staff can view stock movements" ON public.stock_movements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Management can manage stock movements" ON public.stock_movements
  FOR ALL USING (has_management_access(auth.uid()));

-- Create function to update stock when sale is made
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce stock quantity
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Record stock movement
  INSERT INTO public.stock_movements (
    product_id,
    movement_type,
    quantity,
    reference_id,
    reference_type,
    created_by
  ) VALUES (
    NEW.product_id,
    'sale',
    -NEW.quantity,
    NEW.transaction_id,
    'sale',
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic stock reduction
CREATE TRIGGER on_sale_update_stock
  AFTER INSERT ON public.sales_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_sale();

-- Create function to update stock when purchase is completed
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update stock for all items in the purchase order
    UPDATE public.products p
    SET stock_quantity = stock_quantity + poi.quantity
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
      AND p.id = poi.product_id;
    
    -- Record stock movements
    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity,
      reference_id,
      reference_type,
      created_by
    )
    SELECT
      poi.product_id,
      'purchase',
      poi.quantity,
      NEW.id,
      'purchase_order',
      NEW.approved_by
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for purchase completion
CREATE TRIGGER on_purchase_complete_update_stock
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_purchase();

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_stock ON public.products(stock_quantity);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_sales_items_transaction ON public.sales_items(transaction_id);
CREATE INDEX idx_sales_items_product ON public.sales_items(product_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();