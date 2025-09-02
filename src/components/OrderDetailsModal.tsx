import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, DollarSign, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    images?: string[];
  };
  variant?: {
    size?: string;
    color?: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  total_items: number;
  created_at: string;
  notes?: string;
  order_items: OrderItem[];
}

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: "Pendente", variant: "secondary" as const, icon: Package },
    processing: { label: "Processando", variant: "default" as const, icon: Package },
    shipped: { label: "Enviado", variant: "outline" as const, icon: Package },
    delivered: { label: "Entregue", variant: "default" as const, icon: Package }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId && open) {
      fetchOrder();
    }
  }, [orderId, open]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch order items with product details
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products:product_id (
            name,
            images
          ),
          product_variants:variant_id (
            size,
            color
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Transform the data to match the expected format
      const transformedOrder = {
        ...orderData,
        order_items: orderItems.map(item => ({
          ...item,
          product: item.products,
          variant: item.product_variants
        }))
      };

      setOrder(transformedOrder);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId || !open) return null;
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Carregando detalhes do pedido...</div>
        </DialogContent>
      </Dialog>
    );
  }
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pedido #{order.id.slice(0, 8)}</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data do Pedido</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total de Itens</p>
                <p className="text-sm text-muted-foreground">{order.total_items} peças</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div>
              <p className="text-sm font-medium mb-2">Observações</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {order.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0"></div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant.size && `Tamanho: ${item.variant.size}`}
                        {item.variant.size && item.variant.color && " • "}
                        {item.variant.color && `Cor: ${item.variant.color}`}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm">Qtd: {item.quantity}</span>
                      <span className="text-sm">Unit: R$ {item.unit_price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">R$ {item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({order.total_items} peças):</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Desconto ({order.discount_percentage}%):</span>
                  <span>-R$ {order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>R$ {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}