import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CartContextType {
  cartItemsCount: number;
  refreshCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCartItemsCount(0);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setCartItemsCount(0);
        return;
      }

      const { data: cartItems, error } = await supabase
        .from("cart_items" as any)
        .select("quantity")
        .eq("user_id", profile.id);

      if (error) throw error;

      const totalCount = (cartItems || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemsCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartItemsCount(0);
    }
  };

  useEffect(() => {
    refreshCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartItemsCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
};