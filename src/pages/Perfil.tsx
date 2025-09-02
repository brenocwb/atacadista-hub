import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Percent, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "@/contexts/CartContext";

export default function Perfil() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    coverage_area: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItemsCount } = useCartContext();

  useEffect(() => {
    fetchUser();
  }, []);

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

      if (profile) {
        setUser(profile);
        setFormData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          coverage_area: profile.coverage_area || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          coverage_area: formData.coverage_area,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      // Refresh user data
      await fetchUser();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Administrador</Badge>;
      case "representante":
        return <Badge variant="secondary">Representante</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} cartItemsCount={cartItemsCount} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Carregando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} cartItemsCount={cartItemsCount} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações da conta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        O e-mail não pode ser alterado
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverage_area">Área de Cobertura</Label>
                    <Textarea
                      id="coverage_area"
                      value={formData.coverage_area}
                      onChange={(e) => setFormData({ ...formData, coverage_area: e.target.value })}
                      placeholder="Descreva sua área de atuação (cidades, regiões, etc.)"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo de Conta:</span>
                  {getRoleBadge(user?.role)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={user?.is_active ? "default" : "destructive"}>
                    {user?.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de Comissão:</span>
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">{user?.commission_rate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Membro desde:</span>
                  <span className="text-sm">
                    {new Date(user?.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/dashboard")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Ver Dashboard
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/pedidos")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Meus Pedidos
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/catalogo")}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}