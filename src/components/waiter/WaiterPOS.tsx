import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2, Send } from "lucide-react";
import { formatIDR } from "@/lib/currency";

interface Product {
  id: string;
  name_id: string;
  name_en: string;
  price: number;
  stock_quantity: number;
  category_id: string;
}

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  status: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface FBOrder {
  id: string;
  room_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  rooms: {
    room_number: string;
    room_name: string;
  };
  fb_order_items: {
    product_id: string;
    quantity: number;
    products: {
      name_id: string;
    };
  }[];
}

export default function WaiterPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [orders, setOrders] = useState<FBOrder[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name_id');

    if (productsData) setProducts(productsData);

    // Load occupied rooms
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, room_number, room_name, status')
      .eq('status', 'occupied')
      .order('room_number');

    if (roomsData) setRooms(roomsData);

    // Load pending orders
    const { data: ordersData } = await supabase
      .from('fb_orders')
      .select(`
        *,
        rooms(room_number, room_name),
        fb_order_items(
          product_id,
          quantity,
          products(name_id)
        )
      `)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: false });

    if (ordersData) setOrders(ordersData as any);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error("Stok tidak mencukupi");
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unit_price
            }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name_id,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      toast.error("Stok tidak mencukupi");
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.unit_price
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedRoom) {
      toast.error("Pilih ruangan terlebih dahulu");
      return;
    }

    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const total = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('fb_orders')
        .insert({
          room_id: selectedRoom,
          waiter_id: user.user?.id,
          total_amount: total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('fb_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Pesanan berhasil dibuat!");
      setCart([]);
      setSelectedRoom("");
      loadData();
    } catch (error: any) {
      toast.error("Gagal membuat pesanan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('fb_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Status pesanan diperbarui!");
      loadData();
    } catch (error: any) {
      toast.error("Gagal memperbarui status: " + error.message);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ready': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'served': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Menu F&B</CardTitle>
            <CardDescription>Pilih item untuk ditambahkan ke pesanan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">{product.name_id}</h3>
                    <p className="text-lg font-bold text-primary">
                      {formatIDR(product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stok: {product.stock_quantity}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Tidak ada pesanan aktif
                </p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {order.rooms.room_name} - Kamar {order.rooms.room_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatIDR(order.total_amount)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === 'pending' ? 'Menunggu' : 'Diproses'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                        >
                          Proses
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          Siap
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Ruangan</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruangan" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_name} - {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Keranjang kosong
                </p>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{item.product_name}</h4>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-semibold">{formatIDR(item.subtotal)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatIDR(calculateTotal())}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitOrder}
                  disabled={loading || !selectedRoom}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Memproses..." : "Kirim Pesanan"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
