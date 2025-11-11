import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddItemsToRoomDialog from "@/components/dashboard/AddItemsToRoomDialog";
import ExtendTimeDialog from "@/components/dashboard/ExtendTimeDialog";
import { formatIDR } from "@/lib/currency";

export default function WaiterRoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [extendTimeOpen, setExtendTimeOpen] = useState(false);
  const [duration, setDuration] = useState<string>("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadRoomData();
    const interval = setInterval(calculateDuration, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      // Get active booking for this room if occupied
      if (roomData.status === "occupied") {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("id")
          .eq("room_id", roomId)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (bookingData) {
          setBookingId(bookingData.id);
        }

        const { data: ordersData } = await supabase
          .from("fb_orders")
          .select(`
            *,
            fb_order_items (
              *,
              products (name_id, name_en, price)
            )
          `)
          .eq("room_id", roomId)
          .in("status", ["pending", "preparing", "ready"]);

        const allItems = ordersData?.flatMap(order => 
          order.fb_order_items.map((item: any) => ({
            ...item,
            product: item.products
          }))
        ) || [];
        setItems(allItems);
      }
    } catch (error) {
      console.error("Error loading room:", error);
      toast.error("Gagal memuat data ruangan");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!room?.current_session_start) return;
    
    const start = new Date(room.current_session_start).getTime();
    const now = Date.now();
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setDuration(`${hours}j ${minutes}m`);
  };

  if (loading) {
    return (
      <DashboardLayout role="waiter">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout role="waiter">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Ruangan tidak ditemukan</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="waiter">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur shadow-md hover:shadow-xl transition-shadow">
          <CardHeader className="bg-secondary text-secondary-foreground rounded-t-xl">
            <CardTitle className="text-xl font-semibold tracking-wide">
              {room.room_name || room.room_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{room.status === "occupied" ? "Terisi" : "Tersedia"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Durasi</p>
                <p className="font-semibold">{duration || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarif per Jam</p>
                <p className="font-semibold text-primary">{formatIDR(room.hourly_rate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kapasitas</p>
                <p className="font-semibold">{room.capacity} orang</p>
              </div>
            </div>

            {room.status === "occupied" && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setExtendTimeOpen(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Perpanjang Waktu
                </Button>
                <Button
                  onClick={() => setAddItemsOpen(true)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle>Item yang Dipesan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Item</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada item yang dipesan
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name_id || item.product?.name_en}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatIDR(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatIDR(item.subtotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {room && (
        <>
          <AddItemsToRoomDialog
            room={room}
            open={addItemsOpen}
            onOpenChange={setAddItemsOpen}
            onUpdate={loadRoomData}
          />
          <ExtendTimeDialog
            open={extendTimeOpen}
            onOpenChange={setExtendTimeOpen}
            bookingId={bookingId}
            hourlyRate={room.hourly_rate || 0}
            onSuccess={loadRoomData}
          />
        </>
      )}
    </DashboardLayout>
  );
}
