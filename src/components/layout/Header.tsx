import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: any;
  cartItemsCount?: number;
}

export const Header = ({ user, cartItemsCount = 0 }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent"
            >
              VIRÁ
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/catalogo")}
              className="text-foreground hover:text-primary"
            >
              Catálogo
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/pedidos")}
              className="text-foreground hover:text-primary"
            >
              Meus Pedidos
            </Button>
            {user?.role === "representante" && (
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-foreground hover:text-primary"
              >
                Dashboard
              </Button>
            )}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="text-foreground hover:text-primary"
              >
                Painel Admin
              </Button>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/carrinho")}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/perfil")}>
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/login")}>Entrar</Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate("/catalogo");
                  setMobileMenuOpen(false);
                }}
              >
                Catálogo
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate("/pedidos");
                  setMobileMenuOpen(false);
                }}
              >
                Meus Pedidos
              </Button>
              {user?.role === "representante" && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                >
                  Dashboard
                </Button>
              )}
              {user?.role === "admin" && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/admin");
                    setMobileMenuOpen(false);
                  }}
                >
                  Painel Admin
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};