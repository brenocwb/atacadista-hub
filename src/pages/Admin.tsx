import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRepresentatives: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wholesaleRules, setWholesaleRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchStats();
    fetchProducts();
    fetchRepresentatives();
    fetchOrders();
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

  const fetchStats = async () => {
    try {
      const [productsCount, representativesCount, ordersCount, revenueSum] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "representante"),
        supabase.from("orders").select("id", { count: "exact" }),
        supabase.from("orders").select("total_amount")
      ]);

      const totalRevenue = revenueSum.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalProducts: productsCount.count || 0,
        totalRepresentatives: representativesCount.count || 0,
        totalOrders: ordersCount.count || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const fetchRepresentatives = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "representante")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepresentatives(data || []);
    } catch (error) {
      console.error("Erro ao carregar representantes:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_representative_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
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

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Carregando painel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie produtos, representantes e pedidos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Representantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRepresentatives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="representatives">Representantes</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="wholesale">Atacado</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Produtos Recentes</h2>
              <Button>Adicionar Produto</Button>
            </div>
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          R$ {product.base_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="representatives" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Representantes</h2>
              <Button>Adicionar Representante</Button>
            </div>
            <div className="grid gap-4">
              {representatives.map((rep) => (
                <Card key={rep.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-medium">{rep.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{rep.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Comissão: {rep.commission_rate}% | Área: {rep.coverage_area || "Não definida"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rep.is_active ? "default" : "secondary"}>
                        {rep.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-xl font-semibold">Pedidos Recentes</h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-medium">Pedido #{order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.profiles?.full_name} | {order.total_items} itens
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wholesale" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Regras de Atacado</h2>
              <Button onClick={() => navigate("/admin/wholesale-rules")}>
                Gerenciar Regras
              </Button>
            </div>
            <div className="grid gap-4">
              {wholesaleRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-medium">
                        {rule.min_quantity} peças ou mais
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {rule.discount_percentage}% de desconto
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Controle de Estoque</h2>
              <Button>Atualizar Estoque</Button>
            </div>
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku || "Não definido"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Estoque</p>
                        <p className={`font-semibold ${(product.stock_quantity || 0) < 10 ? 'text-destructive' : 'text-foreground'}`}>
                          {product.stock_quantity || 0} un.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={(product.stock_quantity || 0) < 10 ? "destructive" : "default"}>
                          {(product.stock_quantity || 0) < 10 ? "Baixo" : "OK"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}