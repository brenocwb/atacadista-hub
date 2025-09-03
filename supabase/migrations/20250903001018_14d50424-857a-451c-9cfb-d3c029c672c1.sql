-- Fix cart_items RLS policies to work with auth.uid() directly
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Admins can manage all cart items" ON cart_items;

-- Create new policies that use auth.uid() directly
CREATE POLICY "Users can view their own cart items" 
ON cart_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" 
ON cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" 
ON cart_items FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" 
ON cart_items FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cart items" 
ON cart_items FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());