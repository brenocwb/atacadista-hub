import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  images: string[];
}

interface Variant {
  id: string;
  size?: string;
  color?: string;
  additional_price: number;
  stock_quantity: number;
}

interface ProductVariantModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>;
}

export const ProductVariantModal = ({
  product,
  open,
  onOpenChange,
  onAddToCart,
}: ProductVariantModalProps) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product.id) {
      fetchVariants();
    }
  }, [open, product.id]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true);

      if (error) throw error;
      setVariants(data || []);
      
      // Auto-select first variant if only one exists
      if (data && data.length === 1) {
        setSelectedVariantId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };

  const handleAddToCart = async () => {
    setLoading(true);
    const success = await onAddToCart(product.id, selectedVariantId || undefined, quantity);
    if (success) {
      onOpenChange(false);
      setQuantity(1);
      setSelectedVariantId("");
    }
    setLoading(false);
  };

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const totalPrice = product.base_price + (selectedVariant?.additional_price || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>

          {/* Variants Selection */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <Label>Selecione uma variante:</Label>
              <RadioGroup
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
                className="space-y-2"
              >
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={variant.id} id={variant.id} />
                    <label
                      htmlFor={variant.id}
                      className="flex-1 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        {variant.size && <span className="font-medium">{variant.size}</span>}
                        {variant.size && variant.color && <span> • </span>}
                        {variant.color && <span>{variant.color}</span>}
                        {variant.stock_quantity <= 5 && variant.stock_quantity > 0 && (
                          <span className="text-amber-600 text-sm ml-2">
                            (Restam {variant.stock_quantity})
                          </span>
                        )}
                        {variant.stock_quantity === 0 && (
                          <span className="text-destructive text-sm ml-2">(Sem estoque)</span>
                        )}
                      </div>
                      <div className="text-right">
                        {variant.additional_price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +R$ {variant.additional_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade:</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedVariant?.stock_quantity || 999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24"
            />
          </div>

          {/* Price Display */}
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Preço unitário:</div>
            <div className="text-2xl font-bold">
              R$ {totalPrice.toFixed(2)}
            </div>
            {quantity > 1 && (
              <div className="text-sm text-muted-foreground">
                Total: R$ {(totalPrice * quantity).toFixed(2)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={
                loading ||
                (variants.length > 0 && !selectedVariantId) ||
                (selectedVariant && selectedVariant.stock_quantity === 0)
              }
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Adicionando..." : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};