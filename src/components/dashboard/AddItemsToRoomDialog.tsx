import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddItemsToRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any;
  onUpdate: () => void;
}

export default function AddItemsToRoomDialog({ open, onOpenChange, room, onUpdate }: AddItemsToRoomDialogProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order(t('product_name_column')); // name_id or name_en

      setProducts(data || []);
      setLoading(false);
    };

    if (open) {
      loadProducts();
      setCart({}); // Reset cart on open
    }
  }, [open, t]);

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      const product = products.find(p => p.id === productId);
      if (newQty > product.stock_quantity) {
        toast.warning(t('add_items.stock_exceeded_warning', { stock: product.stock_quantity }));
        return { ...prev, [productId]: product.stock_quantity };
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) {
      toast.error(t("add_items.empty_cart_error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const orderItems = Object.entries(cart).map(([productId, quantity]) => ({
        room_id: room.id,
        product_id: productId,
        quantity,
        cashier_id: user?.id,
        is_paid: false,
      }));

      const { error } = await supabase.from("room_orders").insert(orderItems);

      if (error) throw error;

      toast.success(t("add_items.order_success"));
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product?.price || 0) * quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {t("add_items.title")} - {room?.room_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh]">
          {/* Products List */}
          <div className="space-y-3 overflow-y-auto pr-2">
             <h3 className="font-semibold text-lg">{t("add_items.select_products")}</h3>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{product[t('product_name_column')]}</h4>
                      <p className="text-sm text-muted-foreground">Rp {product.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t("add_items.stock")} {product.stock_quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => updateCart(product.id, -1)} disabled={!cart[product.id]}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-lg">{cart[product.id] || 0}</span>
                      <Button size="icon" variant="outline" onClick={() => updateCart(product.id, 1)} >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Cart */}
          <div className="flex flex-col justify-between rounded-lg border p-4">
             <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <ShoppingCart className="h-5 w-5" />
                    {t("add_items.cart")}
                </h3>
                <div className="space-y-3 overflow-y-auto h-[calc(60vh-200px)] pr-2">
                {Object.keys(cart).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{t("add_items.cart_empty")}</p>
                ) : (
                    Object.entries(cart).map(([productId, quantity]) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                        <div key={productId} className="flex justify-between items-center">
                            <div>
                            <p className="font-medium">{product[t('product_name_column')]}</p>
                            <p className="text-sm text-muted-foreground">
                                {quantity} x Rp {product.price.toLocaleString()}
                            </p>
                            </div>
                            <p className="font-semibold">Rp {(product.price * quantity).toLocaleString()}</p>
                        </div>
                        );
                    })
                )}
                </div>
             </div>
            <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span>{t("common.total")}</span>
                <span>Rp {total.toLocaleString()}</span>
                </div>
            </div>
          </div>
        </div>
         <DialogFooter className="mt-4">
             <Button
                className="w-full md:w-auto"
                onClick={handleSubmit}
                disabled={Object.keys(cart).length === 0 || isSubmitting}
                size="lg"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4"/>}
                {isSubmitting ? t("add_items.processing") : t("add_items.confirm_order")}
              </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
