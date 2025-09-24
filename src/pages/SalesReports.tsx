import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SalesReport {
  representative_name: string;
  representative_id: string;
  total_orders: number;
  total_sales: number;
  total_commissions: number;
  month_year: string;
}

export default function SalesReports() {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalCommissions: 0,
    totalOrders: 0,
    totalRepresentatives: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    // Set default dates (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate]);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_sales_reports', {
          start_date: startDate || null,
          end_date: endDate || null
        });

      if (error) throw error;

      setReports(data || []);
      
      // Calculate summary
      const totalSales = data?.reduce((sum: number, report: any) => sum + Number(report.total_sales), 0) || 0;
      const totalCommissions = data?.reduce((sum: number, report: any) => sum + Number(report.total_commissions), 0) || 0;
      const totalOrders = data?.reduce((sum: number, report: any) => sum + Number(report.total_orders), 0) || 0;
      const uniqueReps = new Set(data?.map((report: any) => report.representative_id)).size || 0;

      setSummary({
        totalSales,
        totalCommissions,
        totalOrders,
        totalRepresentatives: uniqueReps,
      });

    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios de vendas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Representante", "Mês/Ano", "Total de Pedidos", "Total de Vendas", "Total de Comissões"].join(","),
      ...reports.map(report => [
        report.representative_name,
        report.month_year ? new Date(report.month_year).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "N/A",
        report.total_orders,
        `R$ ${Number(report.total_sales).toFixed(2)}`,
        `R$ ${Number(report.total_commissions).toFixed(2)}`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_${startDate}_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatMonth = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={currentUser} cartItemsCount={0} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Carregando relatórios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} cartItemsCount={0} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Relatórios de Vendas e Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho dos representantes e vendas
          </p>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Button onClick={exportToCSV} disabled={reports.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCommissions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Representantes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRepresentatives}</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Representante e Período</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Representante</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Comissões</TableHead>
                    <TableHead className="text-right">Taxa Média</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report, index) => {
                    const commissionRate = report.total_sales > 0 
                      ? (Number(report.total_commissions) / Number(report.total_sales)) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={`${report.representative_id}-${report.month_year}-${index}`}>
                        <TableCell className="font-medium">
                          {report.representative_name}
                        </TableCell>
                        <TableCell>{formatMonth(report.month_year)}</TableCell>
                        <TableCell className="text-right">{report.total_orders}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(report.total_sales))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(report.total_commissions))}
                        </TableCell>
                        <TableCell className="text-right">
                          {commissionRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}