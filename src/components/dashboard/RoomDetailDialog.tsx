import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Clock, DollarSign, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  status: string;
  hourly_rate: number;
  current_session_start: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  notes: string | null;
}

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes: string | null;
}

interface RoomDetailDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function RoomDetailDialog({
  room,
  open,
  onOpenChange,
  onUpdate,
}: RoomDetailDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({});
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    price: 0,
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    if (room && open) {
      loadOrders();
      calculateDuration();
      
      // Setup realtime for orders
      const ordersChannel = supabase
        .channel('room-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `room_id=eq.${room.id}`,
          },
          () => loadOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [room, open]);

  const calculateDuration = () => {
    if (room?.current_session_start) {
      const start = new Date(room.current_session_start);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration(`${hours} jam ${minutes} menit`);
    }
  };

  useEffect(() => {
    const interval = setInterval(calculateDuration, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [room]);

  const loadOrders = async () => {
    if (!room) return;

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("room_id", room.id)
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData as any);

      // Load items for each order
      const itemsMap: { [key: string]: OrderItem[] } = {};
      for (const order of ordersData) {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
        if (items) {
          itemsMap[order.id] = items as any;
        }
      }
      setOrderItems(itemsMap);
    }
  };

  const createNewOrder = async () => {
    if (!room) return;

    const orderNumber = `ORD-${Date.now()}`;
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from("orders").insert({
      room_id: room.id,
      waiter_id: user.user?.id,
      order_number: orderNumber,
      total_amount: 0,
    } as any);

    if (error) {
      toast.error("Gagal membuat pesanan: " + error.message);
    } else {
      toast.success("Pesanan baru dibuat");
      loadOrders();
      setShowAddItem(true);
    }
  };

  const addItemToOrder = async (orderId: string) => {
    if (!newItem.name || newItem.price <= 0) {
      toast.error("Nama dan harga item harus diisi");
      return;
    }

    const subtotal = newItem.quantity * newItem.price;

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: orderId,
      item_name: newItem.name,
      quantity: newItem.quantity,
      price: newItem.price,
      subtotal: subtotal,
    } as any);

    if (itemError) {
      toast.error("Gagal menambah item: " + itemError.message);
      return;
    }

    // Update order total
    const currentTotal = orders.find((o) => o.id === orderId)?.total_amount || 0;
    const { error: orderError } = await supabase
      .from("orders")
      .update({ total_amount: currentTotal + subtotal } as any)
      .eq("id", orderId);

    if (orderError) {
      toast.error("Gagal update total: " + orderError.message);
      return;
    }

    toast.success("Item ditambahkan");
    setNewItem({ name: "", quantity: 1, price: 0 });
    setShowAddItem(false);
    loadOrders();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status } as any)
      .eq("id", orderId);

    if (error) {
      toast.error("Gagal update status: " + error.message);
    } else {
      toast.success(`Status diubah ke ${status}`);
      loadOrders();
    }
  };

  const deleteOrderItem = async (itemId: string, orderId: string, subtotal: number) => {
    const { error: itemError } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId);

    if (itemError) {
      toast.error("Gagal hapus item: " + itemError.message);
      return;
    }

    // Update order total
    const currentTotal = orders.find((o) => o.id === orderId)?.total_amount || 0;
    await supabase
      .from("orders")
      .update({ total_amount: Math.max(0, currentTotal - subtotal) } as any)
      .eq("id", orderId);

    toast.success("Item dihapus");
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      preparing: "secondary",
      served: "default",
      completed: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Detail Ruangan - {room.room_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <Card className="p-4 bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                  {room.status === "occupied" ? "Terisi" : "Tersedia"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarif/Jam</p>
                <p className="font-semibold">Rp {room.hourly_rate.toLocaleString()}</p>
              </div>
              {room.current_session_start && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Durasi</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimasi Biaya</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Rp {(Math.ceil(parseFloat(duration)) * room.hourly_rate).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Separator />

          {/* Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pesanan F&B
              </h3>
              {room.status === "occupied" && (
                <Button onClick={createNewOrder} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Pesanan Baru
                </Button>
              )}
            </div>

            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada pesanan untuk ruangan ini
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <p className="font-bold">
                          Rp {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {orderItems[order.id]?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}x @ Rp {item.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">
                              Rp {item.subtotal.toLocaleString()}
                            </p>
                            {order.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteOrderItem(item.id, order.id, item.subtotal)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Form */}
                    {showAddItem && order.status === "pending" && (
                      <div className="border-t pt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Nama item"
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={newItem.quantity}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                quantity: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Harga"
                            value={newItem.price}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addItemToOrder(order.id)}
                            className="flex-1"
                          >
                            Tambah Item
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddItem(false)}
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddItem(!showAddItem)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Item
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                          >
                            Proses
                          </Button>
                        </>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "served")}
                        >
                          Tandai Tersaji
                        </Button>
                      )}
                      {order.status === "served" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "completed")}
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
