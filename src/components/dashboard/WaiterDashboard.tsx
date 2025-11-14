import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import RoomCard from "./RoomCard";
import StatsCard from "./StatsCard";
import { ShoppingCart, Clock, Package } from "lucide-react";
import WaiterTaskHistory from "@/components/waiter/WaiterTaskHistory";
import { Skeleton } from "@/components/ui/skeleton";

const WaiterRoomDetailCard = lazy(() => import("@/components/waiter/WaiterRoomDetailCard"));

export default function WaiterDashboard() {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    occupiedRooms: 0,
    pendingItems: 0,
  });

  useEffect(() => {
    loadRooms();

    const channel = supabase
      .channel('rooms-waiter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRooms = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    setRooms(data || []);

    // Calculate stats
    const occupied = data?.filter(r => r.status === "occupied").length || 0;
    
    // Get today's sales items count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: salesData } = await supabase
      .from("sales_items")
      .select("*")
      .gte("created_at", today.toISOString());
    
    setStats({
      activeOrders: salesData?.length || 0,
      occupiedRooms: occupied,
      pendingItems: salesData?.length || 0,
    });
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setDetailOpen(true);
  };

  return (
    <DashboardLayout role="waiter">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard Waiter</h2>
          <p className="text-muted-foreground">Kelola pesanan dan tugas ruangan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Pesanan Aktif"
            value={stats.activeOrders}
            icon={ShoppingCart}
          />
          <StatsCard
            title="Ruangan Terisi"
            value={stats.occupiedRooms}
            icon={Clock}
          />
          <StatsCard
            title="Item Dipesan"
            value={stats.pendingItems}
            icon={Package}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Room Cards */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xl font-semibold">Ruangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                <p className="text-lg font-medium mb-2">Tidak ada ruangan tersedia</p>
                <p className="text-sm text-muted-foreground">
                  Hubungi manager untuk membuat ruangan baru
                </p>
              </div>
            )}
          </div>

          {/* Task History */}
          <div className="lg:col-span-1">
            <WaiterTaskHistory />
          </div>
        </div>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <WaiterRoomDetailCard
          room={selectedRoom}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </Suspense>
    </DashboardLayout>
  );
}
