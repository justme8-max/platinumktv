import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StaggeredGrid } from "@/components/ui/staggered-grid";

interface Product {
  id: string;
  name_id: string;
  name_en: string;
  sku: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  category_id: string | null;
  categories?: {
    name_id: string;
    name_en: string;
  };
}

export default function ProductList({ onAdd, onEdit }: { onAdd: () => void; onEdit: (product: Product) => void }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name_id, name_en)")
        .order("name_id");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error(t("Gagal memuat produk", "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>{t("Memuat...", "Loading...")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{t("Daftar Produk", "Product List")}</h3>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("Tambah Produk", "Add Product")}
        </Button>
      </div>

      <StaggeredGrid columns={{ default: 1, md: 2, lg: 3 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isLowStock = product.stock_quantity <= product.min_stock_level;
          
          return (
            <Card key={product.id} className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{product.name_id}</h4>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {product.categories && (
                  <Badge variant="outline">{product.categories.name_id}</Badge>
                )}

                <div className="flex justify-between text-sm">
                  <span>{t("Harga:", "Price:")}</span>
                  <span className="font-semibold">Rp {product.price.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span>{t("Stok:", "Stock:")}</span>
                  <div className="flex items-center gap-2">
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    <span className={isLowStock ? "text-orange-500 font-semibold" : ""}>{product.stock_quantity}</span>
                  </div>
                </div>

                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? t("Aktif", "Active") : t("Tidak Aktif", "Inactive")}
                </Badge>
              </div>
            </Card>
          );
        })}
      </StaggeredGrid>
    </div>
  );
}
