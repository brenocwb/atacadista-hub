import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "@/contexts/CartContext";

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  variant_id?: string;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  images?: string[];
}

interface Variant {
  id: string;
  size?: string;
  color?: string;
  additional_price: number;
}

interface CartItemWithDetails extends CartItem {
  product: Product;
  variant?: Variant;
}

interface WholesaleRule {
  id: string;
  min_quantity: number;
  discount_percentage: number;
}

export default function Carrinho() {
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [wholesaleRules, setWholesaleRules] = useState<WholesaleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItemsCount, refreshCartCount } = useCartContext();

  useEffect(() => {
    fetchUser();
    fetchCartItems();
    fetchWholesaleRules();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setUser(profile);
    }
  };

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use a simpler approach due to TypeScript limitations
      const { data: cartData, error } = await supabase
        .from("cart_items" as any)
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Fetch product and variant details separately
      const itemsWithDetails = await Promise.all(
        (cartData || []).map(async (item: any) => {
          const { data: product } = await supabase
            .from("products")
            .select("id, name, base_price, images")
            .eq("id", item.product_id)
            .single();

          let variant = null;
          if (item.variant_id) {
            const { data: variantData } = await supabase
              .from("product_variants")
              .select("id, size, color, additional_price")
              .eq("id", item.variant_id)
              .single();
            variant = variantData;
          }

          return {
            ...item,
            product,
            variant
          };
        })
      );

      setCartItems(itemsWithDetails.filter(item => item.product));
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWholesaleRules = async () => {
    try {
      const { data, error } = await supabase
        .from("wholesale_rules")
        .select("*")
        .eq("is_active", true)
        .order("min_quantity");

      if (error) throw error;
      setWholesaleRules(data || []);
    } catch (error) {
      console.error("Erro ao carregar regras de atacado:", error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from("cart_items" as any)
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      
      // Refresh cart count
      await refreshCartCount();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar quantidade",
        description: "Tente novamente.",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items" as any)
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      
      // Refresh cart count
      await refreshCartCount();
      
      toast({
        title: "Item removido",
        description: "O item foi removido do carrinho.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover item",
        description: "Tente novamente.",
      });
    }
  };

  const calculateTotals = () => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const basePrice = item.product.base_price;
      const variantPrice = item.variant?.additional_price || 0;
      return sum + (basePrice + variantPrice) * item.quantity;
    }, 0);

    // Find applicable wholesale rule
    const applicableRule = wholesaleRules
      .filter(rule => totalQuantity >= rule.min_quantity)
      .sort((a, b) => b.discount_percentage - a.discount_percentage)[0];

    const discountAmount = applicableRule ? (subtotal * applicableRule.discount_percentage / 100) : 0;
    const total = subtotal - discountAmount;

    return {
      totalQuantity,
      subtotal,
      discountAmount,
      total,
      applicableRule
    };
  };

  const createOrder = async () => {
    if (!user || cartItems.length === 0) return;

    try {
      const { totalQuantity, subtotal, discountAmount, total, applicableRule } = calculateTotals();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          representative_id: user.id,
          total_items: totalQuantity,
          subtotal,
          discount_amount: discountAmount,
          discount_percentage: applicableRule?.discount_percentage || 0,
          total_amount: total,
          status: "pending"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id,
        quantity: item.quantity,
        unit_price: item.product.base_price + (item.variant?.additional_price || 0),
        total_price: (item.product.base_price + (item.variant?.additional_price || 0)) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { error: clearError } = await supabase
          .from("cart_items" as any)
          .delete()
          .eq("user_id", authUser.id);

        if (clearError) throw clearError;
      }

      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido #${order.id.slice(0, 8)} foi criado.`,
      });

      // Refresh cart count after clearing cart
      await refreshCartCount();

      navigate("/pedidos");
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar pedido",
        description: "Tente novamente.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} cartItemsCount={cartItemsCount} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center animate-fade-in">Carregando carrinho...</div>
        </div>
      </div>
    );
  }

  const { totalQuantity, subtotal, discountAmount, total, applicableRule } = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} cartItemsCount={cartItemsCount} />
      
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Carrinho de Compras</h1>
          <p className="text-muted-foreground">
            {cartItems.length === 0 ? "Seu carrinho está vazio" : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'itens'} no carrinho`}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-6">
                Explore nosso catálogo e adicione produtos ao carrinho
              </p>
              <Button onClick={() => navigate("/catalogo")}>
                <Package className="mr-2 h-4 w-4" />
                Ver Catálogo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="animate-scale-in">
                  <CardContent className="flex items-center space-x-4 p-6">
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0"></div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant.size && `Tamanho: ${item.variant.size}`}
                          {item.variant.size && item.variant.color && " • "}
                          {item.variant.color && `Cor: ${item.variant.color}`}
                        </p>
                      )}
                      <p className="text-lg font-semibold">
                        R$ {(item.product.base_price + (item.variant?.additional_price || 0)).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalQuantity} peças):</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  
                  {applicableRule && (
                    <>
                      <div className="flex justify-between text-accent">
                        <span>Desconto de atacado:</span>
                        <span>-R$ {discountAmount.toFixed(2)}</span>
                      </div>
                      <Badge variant="secondary" className="w-full justify-center">
                        {applicableRule.discount_percentage}% off - {applicableRule.min_quantity}+ peças
                      </Badge>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  
                  <Button className="w-full" onClick={createOrder}>
                    Finalizar Pedido
                  </Button>
                </CardContent>
              </Card>

              {/* Wholesale Rules Info */}
              {wholesaleRules.length > 0 && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle className="text-sm">Regras de Atacado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {wholesaleRules.map((rule) => (
                      <div
                        key={rule.id}
                         className={`flex justify-between text-sm p-2 rounded ${
                           totalQuantity >= rule.min_quantity
                             ? "bg-accent/20 text-accent"
                             : "text-muted-foreground"
                         }`}
                      >
                        <span>{rule.min_quantity}+ peças:</span>
                        <span>{rule.discount_percentage}% off</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}