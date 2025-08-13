-- Add stock_quantity column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;

-- Update products table with updated_at trigger
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create cart_items table for shopping cart functionality
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Enable RLS for cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart items policies
CREATE POLICY "Users can manage their own cart items" 
ON public.cart_items 
FOR ALL 
USING (user_id IN (SELECT user_id FROM profiles WHERE user_id = auth.uid()));

-- Add updated_at trigger for cart_items
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints for better data integrity
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_representative_id 
  FOREIGN KEY (representative_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_order_id
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_product_id
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_variant_id
  FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;

ALTER TABLE public.product_variants ADD CONSTRAINT fk_product_variants_product_id
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.products ADD CONSTRAINT fk_products_category_id
  FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;