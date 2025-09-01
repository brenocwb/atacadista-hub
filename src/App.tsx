import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import Catalogo from "./pages/Catalogo";
import Carrinho from "./pages/Carrinho";
import Pedidos from "./pages/Pedidos";
import WholesaleRules from "./pages/WholesaleRules";
import CadastrarProduto from "./pages/CadastrarProduto";
import CadastrarRepresentante from "./pages/CadastrarRepresentante";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Set dark mode as default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/admin/wholesale-rules" element={<WholesaleRules />} />
              <Route path="/admin/cadastrar-produto" element={<CadastrarProduto />} />
              <Route path="/admin/cadastrar-representante" element={<CadastrarRepresentante />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
