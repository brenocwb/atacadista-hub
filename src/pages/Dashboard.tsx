import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, DollarSign, Package, TrendingUp, Users, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "@/contexts/CartContext";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";

interface Order {
  id: string;
  total_amount: number;
  total_items: number;
  status: string;
  created_at: string;
  discount_percentage: number;
  subtotal: number;
  discount_amount: number;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingOrders: number;
  completedOrders: number;
  totalItemsSold: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalItemsSold: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItemsCount } = useCartContext();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setUser(profile);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("representative_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar seus pedidos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    const totalOrders = ordersList.length;
    const totalRevenue = ordersList.reduce((sum, order) => sum + order.total_amount, 0);
    const totalItemsSold = ordersList.reduce((sum, order) => sum + order.total_items, 0);
    const pendingOrders = ordersList.filter(order => order.status === "pending").length;
    const completedOrders = ordersList.filter(order => order.status === "completed").length;
    
    // Calculate commission based on user's commission rate
    const totalCommission = user?.commission_rate ? (totalRevenue * user.commission_rate / 100) : 0;

    setStats({
      totalOrders,
      totalRevenue,
      totalCommission,
      pendingOrders,
      completedOrders,
      totalItemsSold,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "processing":
        return <Badge variant="default">Processando</Badge>;
      case "completed":
        return <Badge variant="default">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
          <div className="text-center">Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} cartItemsCount={cartItemsCount} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Representante</h1>
          <p className="text-muted-foreground">
            Acompanhe suas vendas, comissões e performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalItemsSold} itens vendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Ganhas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Taxa: {user?.commission_rate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de conversão: {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Pedidos Recentes</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece vendendo para ver seus dados aqui
                    </p>
                    <Button onClick={() => navigate("/catalogo")}>
                      Ver Catálogo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{order.total_items} itens</p>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                          {getStatusBadge(order.status)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(order => order.status === "pending").map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{order.total_items} itens</p>
                        <p className="text-sm text-muted-foreground">Quantidade</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Concluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(order => order.status === "completed").map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{order.total_items} itens</p>
                        <p className="text-sm text-muted-foreground">Quantidade</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">R$ {((order.total_amount * (user?.commission_rate || 0)) / 100).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Comissão</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <OrderDetailsModal
        orderId={selectedOrder}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}