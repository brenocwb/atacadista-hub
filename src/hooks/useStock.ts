import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StockInfo {
  productId: string;
  variantId?: string;
  available: number;
  hasVariants: boolean;
}

export const useStock = () => {
  const [loading, setLoading] = useState(false);

  const checkStock = async (productId: string, variantId?: string): Promise<StockInfo | null> => {
    setLoading(true);
    try {
      // Check if product has variants
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, stock_quantity")
        .eq("product_id", productId)
        .eq("is_active", true);

      const hasVariants = variants && variants.length > 0;

      if (hasVariants) {
        if (!variantId) {
          // Return total available stock across all variants
          const totalStock = variants.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0);
          return {
            productId,
            available: totalStock,
            hasVariants: true
          };
        } else {
          // Check specific variant stock
          const variant = variants.find(v => v.id === variantId);
          return {
            productId,
            variantId,
            available: variant?.stock_quantity || 0,
            hasVariants: true
          };
        }
      } else {
        // Check product stock directly
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", productId)
          .single();

        return {
          productId,
          available: product?.stock_quantity || 0,
          hasVariants: false
        };
      }
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, quantity: number, variantId?: string) => {
    try {
      // Check if product has variants
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, stock_quantity")
        .eq("product_id", productId)
        .eq("is_active", true);

      const hasVariants = variants && variants.length > 0;

      if (hasVariants && variantId) {
        // Get current stock and update variant stock
        const variant = variants.find(v => v.id === variantId);
        if (variant) {
          const newStock = Math.max(0, variant.stock_quantity - quantity);
          const { error } = await supabase
            .from("product_variants")
            .update({ stock_quantity: newStock })
            .eq("id", variantId);

          if (error) throw error;
        }
      } else if (!hasVariants) {
        // Get current product stock and update
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", productId)
          .single();

        if (product) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - quantity);
          const { error } = await supabase
            .from("products")
            .update({ stock_quantity: newStock })
            .eq("id", productId);

          if (error) throw error;
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      throw error;
    }
  };

  return {
    checkStock,
    updateStock,
    loading
  };
};