import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSuccess: () => void;
}

export default function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name_id: "",
    name_en: "",
    description_id: "",
    description_en: "",
    sku: "",
    price: "",
    cost: "",
    stock_quantity: "",
    min_stock_level: "10",
    category_id: "",
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
    if (product) {
      setFormData({
        name_id: product.name_id,
        name_en: product.name_en,
        description_id: product.description_id || "",
        description_en: product.description_en || "",
        sku: product.sku,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock_quantity: product.stock_quantity.toString(),
        min_stock_level: product.min_stock_level.toString(),
        category_id: product.category_id || "",
        is_active: product.is_active,
      });
    }
  }, [product]);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_id");
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        name_id: formData.name_id,
        name_en: formData.name_en,
        description_id: formData.description_id || null,
        description_en: formData.description_en || null,
        sku: formData.sku,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        category_id: formData.category_id || null,
        is_active: formData.is_active,
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(dataToSave)
          .eq("id", product.id);

        if (error) throw error;
        toast.success(t("Produk berhasil diperbarui", "Product updated successfully"));
      } else {
        const { error } = await supabase
          .from("products")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success(t("Produk berhasil ditambahkan", "Product added successfully"));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? t("Edit Produk", "Edit Product") : t("Tambah Produk", "Add Product")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Nama (ID)", "Name (ID)")}</Label>
              <Input
                required
                value={formData.name_id}
                onChange={(e) => setFormData({ ...formData, name_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Nama (EN)", "Name (EN)")}</Label>
              <Input
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Deskripsi (ID)", "Description (ID)")}</Label>
              <Textarea
                value={formData.description_id}
                onChange={(e) => setFormData({ ...formData, description_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Deskripsi (EN)", "Description (EN)")}</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>SKU</Label>
            <Input
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("Kategori", "Category")}</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t("Pilih Kategori", "Select Category")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Harga Jual", "Selling Price")}</Label>
              <Input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Harga Beli", "Cost Price")}</Label>
              <Input
                type="number"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Stok Awal", "Initial Stock")}</Label>
              <Input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Stok Minimum", "Minimum Stock")}</Label>
              <Input
                type="number"
                required
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>{t("Produk Aktif", "Product Active")}</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Batal", "Cancel")}
            </Button>
            <Button type="submit">
              {t("Simpan", "Save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
