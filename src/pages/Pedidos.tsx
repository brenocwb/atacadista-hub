import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  total_items: number;
  discount_percentage: number;
  created_at: string;
  order_items: {
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
  }[];
}

export default function Pedidos() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
    fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          total_items,
          discount_percentage,
          created_at,
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            product:products(name, images),
            variant:product_variants(size, color)
          )
        `)
        .eq("representative_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar pedidos",
        description: "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };

    const icons: Record<string, any> = {
      pending: Clock,
      processing: Package,
      shipped: Package,
      delivered: CheckCircle,
      cancelled: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  const filterOrdersByStatus = (status?: string) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center animate-fade-in">Carregando pedidos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe o status dos seus pedidos
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendente</TabsTrigger>
            <TabsTrigger value="processing">Processando</TabsTrigger>
            <TabsTrigger value="shipped">Enviado</TabsTrigger>
            <TabsTrigger value="delivered">Entregue</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <OrdersList orders={orders} />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <OrdersList orders={filterOrdersByStatus("pending")} />
          </TabsContent>

          <TabsContent value="processing" className="space-y-4">
            <OrdersList orders={filterOrdersByStatus("processing")} />
          </TabsContent>

          <TabsContent value="shipped" className="space-y-4">
            <OrdersList orders={filterOrdersByStatus("shipped")} />
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            <OrdersList orders={filterOrdersByStatus("delivered")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OrdersList({ orders }: { orders: Order[] }) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };

    const icons: Record<string, any> = {
      pending: Clock,
      processing: Package,
      shipped: Package,
      delivered: CheckCircle,
      cancelled: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  if (orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h2>
          <p className="text-muted-foreground">
            Os pedidos aparecerão aqui quando você fizer compras
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="animate-scale-in">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Pedido #{order.id.slice(0, 8)}
                  {getStatusBadge(order.status)}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(order.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Detalhes
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Order Summary */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
              </span>
              {order.discount_percentage > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {order.discount_percentage}% desconto
                </Badge>
              )}
              <span className="font-semibold text-lg">
                R$ {order.total_amount.toFixed(2)}
              </span>
            </div>

            {/* Order Items Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {order.order_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.size && `${item.variant.size}`}
                        {item.variant.size && item.variant.color && " • "}
                        {item.variant.color && `${item.variant.color}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Qtd: {item.quantity} • R$ {item.unit_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              
              {order.order_items.length > 3 && (
                <div className="flex items-center justify-center p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  +{order.order_items.length - 3} mais {order.order_items.length - 3 === 1 ? 'item' : 'itens'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}