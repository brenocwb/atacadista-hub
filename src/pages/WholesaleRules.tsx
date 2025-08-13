import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Percent, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface WholesaleRule {
  id: string;
  min_quantity: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

export default function WholesaleRules() {
  const [user, setUser] = useState<any>(null);
  const [rules, setRules] = useState<WholesaleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WholesaleRule | null>(null);
  const [formData, setFormData] = useState({
    min_quantity: "",
    discount_percentage: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchRules();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.role !== "admin") {
        navigate("/");
        return;
      }
      
      setUser(profile);
    } else {
      navigate("/login");
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("wholesale_rules")
        .select("*")
        .order("min_quantity");

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Erro ao carregar regras:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar regras",
        description: "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const minQty = parseInt(formData.min_quantity);
    const discount = parseFloat(formData.discount_percentage);

    if (!minQty || minQty < 1) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Quantidade mínima deve ser maior que 0.",
      });
      return false;
    }

    if (!discount || discount < 0 || discount > 100) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Desconto deve estar entre 0% e 100%.",
      });
      return false;
    }

    // Check for duplicate min_quantity (excluding current rule if editing)
    const duplicateRule = rules.find(rule => 
      rule.min_quantity === minQty && 
      (!editingRule || rule.id !== editingRule.id)
    );

    if (duplicateRule) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Já existe uma regra para esta quantidade mínima.",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const ruleData = {
        min_quantity: parseInt(formData.min_quantity),
        discount_percentage: parseFloat(formData.discount_percentage),
        is_active: true
      };

      if (editingRule) {
        const { error } = await supabase
          .from("wholesale_rules")
          .update(ruleData)
          .eq("id", editingRule.id);

        if (error) throw error;

        toast({
          title: "Regra atualizada",
          description: "A regra de atacado foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("wholesale_rules")
          .insert(ruleData);

        if (error) throw error;

        toast({
          title: "Regra criada",
          description: "Nova regra de atacado foi criada com sucesso.",
        });
      }

      setDialogOpen(false);
      setEditingRule(null);
      setFormData({ min_quantity: "", discount_percentage: "" });
      fetchRules();
    } catch (error) {
      console.error("Erro ao salvar regra:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar regra",
        description: "Tente novamente.",
      });
    }
  };

  const handleEdit = (rule: WholesaleRule) => {
    setEditingRule(rule);
    setFormData({
      min_quantity: rule.min_quantity.toString(),
      discount_percentage: rule.discount_percentage.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    try {
      const { error } = await supabase
        .from("wholesale_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      toast({
        title: "Regra excluída",
        description: "A regra de atacado foi excluída com sucesso.",
      });

      fetchRules();
    } catch (error) {
      console.error("Erro ao excluir regra:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir regra",
        description: "Tente novamente.",
      });
    }
  };

  const toggleActive = async (rule: WholesaleRule) => {
    try {
      const { error } = await supabase
        .from("wholesale_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;

      toast({
        title: rule.is_active ? "Regra desativada" : "Regra ativada",
        description: `A regra foi ${rule.is_active ? "desativada" : "ativada"} com sucesso.`,
      });

      fetchRules();
    } catch (error) {
      console.error("Erro ao alterar status da regra:", error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: "Tente novamente.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center animate-fade-in">Carregando regras de atacado...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Regras de Atacado</h1>
            <p className="text-muted-foreground">
              Configure descontos automáticos por quantidade
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingRule(null);
                  setFormData({ min_quantity: "", discount_percentage: "" });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Editar" : "Nova"} Regra de Atacado
                </DialogTitle>
                <DialogDescription>
                  Configure a quantidade mínima e o percentual de desconto
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_quantity">Quantidade Mínima</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount_percentage">Desconto (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 15.5"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingRule ? "Atualizar" : "Criar"} Regra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Total de Regras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="h-5 w-5" />
                Regras Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-gold">
                {rules.filter(rule => rule.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Maior Desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rules.length > 0 
                  ? `${Math.max(...rules.map(r => r.discount_percentage))}%` 
                  : "0%"
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma regra configurada</h2>
                <p className="text-muted-foreground mb-6">
                  Crie a primeira regra de atacado para começar
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quantidade Mínima</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className="animate-scale-in">
                      <TableCell className="font-medium">
                        {rule.min_quantity} peças
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-brand-gold">
                          {rule.discount_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(rule)}
                        >
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(rule.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}