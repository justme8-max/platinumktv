import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, ShoppingCart, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/currency";

interface WaiterRoomDetailCardProps {
  room: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WaiterRoomDetailCard({ room, open, onOpenChange }: WaiterRoomDetailCardProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && room) {
      loadData();
    }
  }, [open, room]);

  const loadData = async () => {
    setLoading(true);
    
    // Load products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name_id');

    if (productsData) setProducts(productsData);

    // Load existing orders for this room
    const { data: ordersData } = await supabase
      .from('fb_orders')
      .select(`
        *,
        fb_order_items(
          *,
          products(name_id, price)
        )
      `)
      .eq('room_id', room?.id)
      .in('status', ['pending', 'preparing']);

    if (ordersData && ordersData.length > 0) {
      const allItems = ordersData.flatMap(order => 
        order.fb_order_items.map((item: any) => ({
          ...item,
          order_id: order.id
        }))
      );
      setOrderItems(allItems);
    }

    setLoading(false);
  };

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      const product = products.find(p => p.id === productId);
      if (newQty > product.stock_quantity) {
        toast.warning(`Stok maksimal: ${product.stock_quantity}`);
        return { ...prev, [productId]: product.stock_quantity };
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleSubmitOrder = async () => {
    if (Object.keys(cart).length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const totalAmount = Object.entries(cart).reduce((sum, [productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return sum + (product?.price || 0) * quantity;
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('fb_orders')
        .insert({
          room_id: room.id,
          waiter_id: user.id,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          order_id: order.id,
          product_id: productId,
          quantity,
          unit_price: product.price,
          subtotal: product.price * quantity
        };
      });

      const { error: itemsError } = await supabase
        .from('fb_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Pesanan berhasil dibuat!");
      setCart({});
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string, orderId: string) => {
    try {
      const { error } = await supabase
        .from('fb_order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Check if order has no more items, delete order
      const { data: remainingItems } = await supabase
        .from('fb_order_items')
        .select('id')
        .eq('order_id', orderId);

      if (!remainingItems || remainingItems.length === 0) {
        await supabase
          .from('fb_orders')
          .delete()
          .eq('id', orderId);
      }

      toast.success("Item dihapus");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const cartTotal = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product?.price || 0) * quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            {room?.room_name} - {room?.room_number}
            <Badge variant={room?.status === 'occupied' ? 'default' : 'secondary'}>
              {room?.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh]">
                <div className="grid grid-cols-2 gap-3">
                  {products.map(product => (
                    <Card key={product.id} className="p-3 hover-scale">
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">{product.name_id}</p>
                          <p className="text-sm text-primary font-medium">
                            {formatIDR(product.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stok: {product.stock_quantity}
                          </p>
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
                          <span className="w-8 text-center font-semibold">
                            {cart[product.id] || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCart(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Cart & Orders */}
          <div className="space-y-4">
            {/* Current Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang Baru
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-32">
                  {Object.keys(cart).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keranjang kosong
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(cart).map(([productId, quantity]) => {
                        const product = products.find(p => p.id === productId);
                        return (
                          <div key={productId} className="flex justify-between items-center text-sm">
                            <span>{product?.name_id}</span>
                            <span className="font-semibold">
                              {quantity} x {formatIDR(product?.price || 0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatIDR(cartTotal)}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSubmitOrder}
                    disabled={loading || Object.keys(cart).length === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buat Pesanan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pesanan Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada pesanan
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2 border rounded">
                          <div>
                            <p className="font-medium">{item.products.name_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x {formatIDR(item.unit_price)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id, item.order_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
