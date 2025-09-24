import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  size: string;
  color: string;
  stock_quantity: number;
  additional_price: number;
}

export default function CadastrarProduto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    basePrice: "",
    categoryId: "",
    stock_quantity: "", // Estoque para produtos sem variantes
    isActive: true,
  });

  useEffect(() => {
    fetchUserAndCategories();
  }, []);

  const fetchUserAndCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile?.role !== 'admin') {
        navigate('/admin');
        return;
      }
      setUser(profile);
      await fetchCategories();
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("product_categories").select("*").eq("is_active", true).order("display_order");
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar as categorias", variant: "destructive" });
    } else {
      setCategories(data || []);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: "", color: "", stock_quantity: 0, additional_price: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const updated = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.basePrice) {
      toast({ title: "Erro de Validação", description: "Nome e preço base são obrigatórios.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (imageFile) {
        const filePath = `public/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
        if (urlData) {
          imageUrls.push(urlData.publicUrl);
        }
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          description: formData.description,
          sku: formData.sku || null,
          base_price: parseFloat(formData.basePrice),
          category_id: formData.categoryId || null,
          stock_quantity: variants.length > 0 ? null : parseInt(formData.stock_quantity) || 0,
          images: imageUrls,
          is_active: formData.isActive,
        })
        .select()
        .single();

      if (productError) throw productError;

      if (variants.length > 0) {
        const variantData = variants.map(variant => ({
          product_id: product.id,
          size: variant.size || null,
          color: variant.color || null,
          stock_quantity: variant.stock_quantity,
          additional_price: variant.additional_price,
          is_active: true,
        }));
        const { error: variantError } = await supabase.from("product_variants").insert(variantData);
        if (variantError) throw variantError;
      }

      toast({ title: "Sucesso!", description: "Produto cadastrado com sucesso." });
      navigate('/admin');
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
          </Button>
          <h1 className="text-3xl font-bold">Cadastrar Produto</h1>
          <p className="text-muted-foreground">Adicione um novo produto ao catálogo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Campos do formulário: name, sku, description, basePrice, categoryId */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Preço Base *</Label>
                  <Input id="basePrice" type="number" step="0.01" min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                <Label htmlFor="isActive">Produto ativo</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Imagem do Produto</CardTitle></CardHeader>
            <CardContent>
                <Label htmlFor="product-image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">Clique para fazer upload</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 800x400px)</p>
                        </div>
                    )}
                    <Input id="product-image" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg" />
                </Label>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Variantes e Estoque</CardTitle>
                <Button type="button" onClick={addVariant} variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Adicionar Variante</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.length > 0 ? (
                variants.map((variant, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeVariant(index)}><X className="h-4 w-4" /></Button>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2"><Label>Tamanho</Label><Input value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} /></div>
                      <div className="space-y-2"><Label>Cor</Label><Input value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} /></div>
                      <div className="space-y-2"><Label>Estoque</Label><Input type="number" min="0" value={variant.stock_quantity} onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)} /></div>
                      <div className="space-y-2"><Label>Preço Adicional</Label><Input type="number" step="0.01" value={variant.additional_price} onChange={(e) => updateVariant(index, 'additional_price', parseFloat(e.target.value) || 0)} /></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Estoque do Produto (sem variantes)</Label>
                  <Input id="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4"><Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Cadastrar Produto"}</Button><Button type="button" variant="outline" onClick={() => navigate('/admin')}>Cancelar</Button></div>
        </form>
      </main>
    </div>
  );
}
