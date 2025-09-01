import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useCartContext } from "@/contexts/CartContext";
import { useStock } from "@/hooks/useStock";
import { ProductVariantModal } from "@/components/catalog/ProductVariantModal";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  images: string[];
  category_id: string;
  sku: string;
  is_active: boolean;
  stock_quantity?: number;
}

interface Category {
  id: string;
  name: string;
}

export default function Catalogo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockInfo, setStockInfo] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { addToCart, loading: addingToCart } = useCart();
  const { cartItemsCount } = useCartContext();
  const { checkStock } = useStock();

  useEffect(() => {
    fetchUser();
    fetchProducts();
    fetchCategories();
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
      
      // Load stock information for each product
      if (data) {
        const stockData: Record<string, number> = {};
        await Promise.all(
          data.map(async (product) => {
            const stock = await checkStock(product.id);
            stockData[product.id] = stock?.available || 0;
          })
        );
        setStockInfo(stockData);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (product: Product) => {
    // First check if product has variants
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", product.id)
      .eq("is_active", true);

    if (variants && variants.length > 0) {
      // Product has variants, open modal
      setSelectedProduct(product);
      setModalOpen(true);
    } else {
      // Product has no variants, add directly
      await addToCart(product.id);
    }
  };

  const handleModalAddToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
    return await addToCart(productId, variantId, quantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} cartItemsCount={cartItemsCount} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Carregando catálogo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} cartItemsCount={cartItemsCount} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Catálogo VIRÁ</h1>
          <p className="text-muted-foreground text-lg">
            Descubra nossa coleção de moda cristã urbana
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-elegant transition-all duration-300">
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.sku && (
                  <Badge variant="secondary" className="w-fit">
                    {product.sku}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 line-clamp-2">
                  {product.description}
                </CardDescription>
                
                <div className="mb-3">
                  <Badge 
                    variant={stockInfo[product.id] > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stockInfo[product.id] > 0 
                      ? `${stockInfo[product.id]} disponível${stockInfo[product.id] > 1 ? 'is' : ''}`
                      : "Sem estoque"
                    }
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    R$ {product.base_price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    size="sm"
                    className="gap-2"
                    disabled={addingToCart || stockInfo[product.id] === 0}
                  >
                    <Plus className="h-4 w-4" />
                    {stockInfo[product.id] === 0 ? "Indisponível" : (addingToCart ? "Adicionando..." : "Adicionar")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum produto encontrado com os filtros selecionados.
            </p>
          </div>
        )}
      </main>

      {/* Product Variant Modal */}
      {selectedProduct && (
        <ProductVariantModal
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedProduct(null);
          }}
          onAddToCart={handleModalAddToCart}
        />
      )}
    </div>
  );
}