import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, User, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Representative {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  coverage_area: string;
  approval_status: string;
  created_at: string;
  commission_rate: number;
  rejection_reason?: string;
}

export default function ApproveRepresentatives() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchRepresentatives();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      navigate("/");
      return;
    }

    setCurrentUser(profile);
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os representantes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (representative: Representative) => {
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .eq("id", representative.id);

      if (updateError) throw updateError;

      // Send approval email notification
      await fetch("/api/send-notification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: representative.email,
          subject: "Conta Aprovada - VIRÁ",
          message: `
            <p>Olá ${representative.full_name},</p>
            <p>Sua solicitação de acesso ao sistema VIRÁ foi <strong>aprovada</strong>!</p>
            <p>Você já pode fazer login e começar a usar o sistema para realizar pedidos.</p>
            <p>Sua taxa de comissão é de <strong>${representative.commission_rate}%</strong>.</p>
            <p>Bem-vindo(a) à equipe VIRÁ!</p>
          `,
          notification_type: "approval",
          user_id: representative.id,
        }),
      });

      // Log notification
      await supabase.from("notification_logs").insert({
        user_id: representative.id,
        notification_type: "approval",
        subject: "Conta Aprovada - VIRÁ",
        message: "Representante aprovado com sucesso",
        email_sent: true,
        sent_at: new Date().toISOString(),
      });

      toast({
        title: "Representante aprovado",
        description: `${representative.full_name} foi aprovado com sucesso.`,
      });

      fetchRepresentatives();
    } catch (error) {
      console.error("Erro ao aprovar representante:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar o representante.",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRep || !rejectionReason.trim()) return;
    
    setIsRejecting(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          approval_status: "rejected",
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          is_active: false,
        })
        .eq("id", selectedRep.id);

      if (updateError) throw updateError;

      // Send rejection email notification
      await fetch("/api/send-notification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedRep.email,
          subject: "Solicitação Rejeitada - VIRÁ",
          message: `
            <p>Olá ${selectedRep.full_name},</p>
            <p>Infelizmente, sua solicitação de acesso ao sistema VIRÁ foi <strong>rejeitada</strong>.</p>
            <p><strong>Motivo:</strong> ${rejectionReason}</p>
            <p>Entre em contato conosco se tiver dúvidas ou quiser fazer uma nova solicitação.</p>
          `,
          notification_type: "rejection",
          user_id: selectedRep.id,
        }),
      });

      // Log notification
      await supabase.from("notification_logs").insert({
        user_id: selectedRep.id,
        notification_type: "rejection",
        subject: "Solicitação Rejeitada - VIRÁ",
        message: `Representante rejeitado: ${rejectionReason}`,
        email_sent: true,
        sent_at: new Date().toISOString(),
      });

      toast({
        title: "Representante rejeitado",
        description: `${selectedRep.full_name} foi rejeitado.`,
      });

      setRejectionReason("");
      setSelectedRep(null);
      fetchRepresentatives();
    } catch (error) {
      console.error("Erro ao rejeitar representante:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar o representante.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "approved":
        return <Badge variant="default">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} cartItemsCount={0} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  const pendingReps = representatives.filter(rep => rep.approval_status === "pending");
  const approvedReps = representatives.filter(rep => rep.approval_status === "approved");
  const rejectedReps = representatives.filter(rep => rep.approval_status === "rejected");

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} cartItemsCount={0} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Aprovação de Representantes</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de acesso ao sistema
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Pendentes de Aprovação ({pendingReps.length})
          </h2>
          {pendingReps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum representante aguardando aprovação
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingReps.map((rep) => (
                <Card key={rep.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{rep.full_name}</span>
                          {getStatusBadge(rep.approval_status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{rep.email}</span>
                          </div>
                          {rep.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{rep.phone}</span>
                            </div>
                          )}
                          {rep.coverage_area && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{rep.coverage_area}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Solicitação enviada em: {new Date(rep.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(rep)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRep(rep)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rejeitar Representante</DialogTitle>
                              <DialogDescription>
                                Informe o motivo da rejeição para {rep.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="reason">Motivo da Rejeição</Label>
                                <Textarea
                                  id="reason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Digite o motivo da rejeição..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedRep(null)}>
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || isRejecting}
                              >
                                {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Approved Representatives */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Representantes Aprovados ({approvedReps.length})
          </h2>
          <Card>
            <CardContent className="p-6">
              {approvedReps.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  Nenhum representante aprovado ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedReps.map((rep) => (
                    <div key={rep.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{rep.full_name}</div>
                        <div className="text-sm text-muted-foreground">{rep.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Comissão: {rep.commission_rate}%</span>
                        {getStatusBadge(rep.approval_status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rejected Representatives */}
        {rejectedReps.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Representantes Rejeitados ({rejectedReps.length})
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {rejectedReps.map((rep) => (
                    <div key={rep.id} className="flex justify-between items-start py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{rep.full_name}</div>
                        <div className="text-sm text-muted-foreground">{rep.email}</div>
                        {rep.rejection_reason && (
                          <div className="text-sm text-red-600 mt-1">
                            Motivo: {rep.rejection_reason}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(rep.approval_status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}