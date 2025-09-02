import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Users, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setUser(profile);
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              VIRÁ
            </h1>
            <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plataforma exclusiva para representantes da marca de moda cristã urbana
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="text-lg px-8 py-3"
              >
                Acessar Conta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/signup")}
                className="text-lg px-8 py-3"
              >
                Solicitar Acesso
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <Package className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Catálogo Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Acesse todo o catálogo de produtos VIRÁ com preços especiais de atacado
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Preços Dinâmicos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sistema inteligente de descontos por quantidade que se adapta automaticamente
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Gestão Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Acompanhe seus pedidos, comissões e área de cobertura em tempo real
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Brand Values */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Moda Cristã Urbana</h2>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="mr-2 h-4 w-4" />
                Qualidade
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="mr-2 h-4 w-4" />
                Estilo
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="mr-2 h-4 w-4" />
                Propósito
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Junte-se à nossa rede de representantes e faça parte de um movimento que combina
              moda urbana contemporânea com valores cristãos autênticos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Olá, {user.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) de volta ao seu painel VIRÁ
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300" onClick={() => navigate("/catalogo")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore produtos e faça seus pedidos
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300" onClick={() => navigate("/pedidos")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Meus Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acompanhe o status dos seus pedidos
              </p>
            </CardContent>
          </Card>

          {user.role === "representante" && (
            <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300" onClick={() => navigate("/dashboard")}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Veja suas vendas e comissões
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300" onClick={() => navigate("/carrinho")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Finalize seus produtos selecionados
              </p>
            </CardContent>
          </Card>

          {user.role === "admin" && (
            <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300" onClick={() => navigate("/admin")}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerencie produtos e representantes
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity or Stats could go here */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span>{user.phone || "Não informado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área de cobertura:</span>
              <span>{user.coverage_area || "Não definida"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de comissão:</span>
              <span>{user.commission_rate}%</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
