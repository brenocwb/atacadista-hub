import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Package, Clock, CheckCircle, XCircle, Truck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCartContext } from "@/contexts/CartContext";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  total_items: number;
  discount_percentage: number;
  created_at: string;
  notes?: string;
  representative_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const statusOptions = [
  { value: "pending", label: "Pendente", icon: Clock },
  { value: "confirmed", label: "Confirmado", icon: CheckCircle },
  { value: "processing", label: "Em Produção", icon: Package },
  { value: "shipped", label: "Enviado", icon: Truck },
  { value: "delivered", label: "Entregue", icon: CheckCircle },
  { value: "cancelled", label: "Cancelado", icon: XCircle },
];

export default function AdminPedidos() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const { cartItemsCount } = useCartContext();

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
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_representative_id_fkey(full_name, email)
        `)
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      toast({
        title: "Status atualizado",
        description: `Pedido #${orderId.slice(0, 8)} alterado para "${getStatusLabel(newStatus)}".`,
      });

      // TODO: Future enhancement - send notification email for shipped/cancelled orders
      if (newStatus === "shipped" || newStatus === "cancelled") {
        console.log(`Future: Send notification email for order ${orderId} - status: ${newStatus}`);
      }

    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default", 
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    
    const statusOption = statusOptions.find(option => option.value === status);
    const Icon = statusOption?.icon || AlertCircle;

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusOption?.label || status}
      </Badge>
    );
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} cartItemsCount={cartItemsCount} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center animate-fade-in">Carregando pedidos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} cartItemsCount={cartItemsCount} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos dos representantes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Todos os Pedidos ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Pedido</TableHead>
                    <TableHead>Representante</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Package className="h-16 w-16 text-muted-foreground" />
                          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                            <p className="text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString("pt-BR", { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{order.total_items}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div>
                            <p>R$ {order.total_amount.toFixed(2)}</p>
                            {order.discount_percentage > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {order.discount_percentage}% desc.
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue>
                                {getStatusBadge(order.status)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <OrderDetailsModal
        orderId={selectedOrder}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}