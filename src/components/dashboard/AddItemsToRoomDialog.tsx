import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface AddItemsToRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any;
  onSuccess: () => void;
}

export default function AddItemsToRoomDialog({ open, onOpenChange, room, onSuccess }: AddItemsToRoomDialogProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name_id");

    setProducts(data || []);
  };

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) {
      toast.error(t("Pilih setidaknya satu item", "Select at least one item"));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create transaction
      const items = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          product_id: productId,
          quantity,
          unit_price: product.price,
          subtotal: product.price * quantity,
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

      const { data: transaction, error: transError } = await supabase
        .from("transactions")
        .insert([{
          room_id: room.id,
          cashier_id: user?.id,
          transaction_type: "food_beverage",
          amount: totalAmount,
          payment_method: "cash",
          description: t("Pesanan ruangan", "Room service order"),
        }])
        .select()
        .single();

      if (transError) throw transError;

      // Add sales items
      const salesItems = items.map(item => ({
        ...item,
        transaction_id: transaction.id,
      }));

      const { error: salesError } = await supabase
        .from("sales_items")
        .insert(salesItems);

      if (salesError) throw salesError;

      toast.success(t("Pesanan berhasil ditambahkan", "Order added successfully"));
      setCart({});
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const total = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product?.price || 0) * quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("Tambah Pesanan - ", "Add Order - ")}
            {room.room_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">{t("Pilih Produk", "Select Products")}</h3>
            {products.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{product.name_id}</h4>
                    <p className="text-sm text-muted-foreground">Rp {product.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t("Stok:", "Stock:")} {product.stock_quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCart(product.id, -1)}
                      disabled={!cart[product.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{cart[product.id] || 0}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCart(product.id, 1)}
                      disabled={product.stock_quantity <= (cart[product.id] || 0)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t("Keranjang", "Cart")}
            </h3>
            <Card className="p-4">
              {Object.keys(cart).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("Keranjang kosong", "Cart is empty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([productId, quantity]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    
                    return (
                      <div key={productId} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {quantity} x Rp {product.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">
                          Rp {(product.price * quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t("Total", "Total")}</span>
                      <span>Rp {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={Object.keys(cart).length === 0 || loading}
            >
              {loading ? t("Memproses...", "Processing...") : t("Konfirmasi Pesanan", "Confirm Order")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
