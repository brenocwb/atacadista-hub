import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  variant_id?: string;
}

export const useCart = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Faça login",
          description: "Você precisa estar logado para adicionar itens ao carrinho.",
        });
        return false;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Perfil não encontrado.",
        });
        return false;
      }

      // Check if item already exists in cart
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items" as any)
        .select("*")
        .eq("user_id", profile.id)
        .eq("product_id", productId)
        .eq("variant_id", variantId || null)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        throw existingError;
      }

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items" as any)
          .update({ quantity: (existingItem as any).quantity + quantity })
          .eq("id", (existingItem as any).id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from("cart_items" as any)
          .insert({
            user_id: profile.id,
            product_id: productId,
            variant_id: variantId,
            quantity: quantity
          });

        if (error) throw error;
      }

      toast({
        title: "Item adicionado",
        description: "Produto foi adicionado ao carrinho com sucesso.",
      });

      return true;
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar ao carrinho",
        description: "Tente novamente.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    addToCart,
    loading
  };
};