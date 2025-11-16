import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import { ShoppingCart, Clock, Package, Plus, List, MessageSquare } from "lucide-react";
import WaiterTaskHistory from "@/components/waiter/WaiterTaskHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredGrid } from "@/components/ui/staggered-grid";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { toast } from "sonner";
import RoomCard from "./RoomCard";

const WaiterRoomDetailCard = lazy(() => import("@/components/waiter/WaiterRoomDetailCard"));

export default function WaiterDashboard() {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    occupiedRooms: 0,
    pendingItems: 0,
  });

  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await loadRooms();
      toast.success("Data diperbarui");
    },
  });

  useEffect(() => {
    loadRooms();

    // Real-time subscriptions for rooms and orders
    const roomsChannel = supabase
      .channel('rooms-waiter-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadRooms();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-waiter-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fb_orders' }, (payload) => {
        console.log('Order update:', payload);
        loadRooms();
        toast.info("Pesanan diperbarui");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      setRooms(data || []);

      // Calculate stats
      const occupied = data?.filter(r => r.status === "occupied").length || 0;
      
      // Get active orders count
      const { data: ordersData } = await supabase
        .from("fb_orders")
        .select("id, fb_order_items(id)")
        .in("status", ["pending", "preparing"]);
      
      const totalItems = ordersData?.reduce((sum, order) => 
        sum + (order.fb_order_items?.length || 0), 0) || 0;
      
      setStats({
        activeOrders: ordersData?.length || 0,
        occupiedRooms: occupied,
        pendingItems: totalItems,
      });
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setDetailOpen(true);
  };

  const fabActions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Tambah Pesanan",
      onClick: () => {
        const occupiedRoom = rooms.find(r => r.status === "occupied");
        if (occupiedRoom) {
          handleRoomClick(occupiedRoom);
        } else {
          toast.error("Tidak ada ruangan terisi");
        }
      },
    },
    {
      icon: <List className="h-5 w-5" />,
      label: "Lihat Semua",
      onClick: () => {
        toast.info("Menampilkan semua ruangan");
      },
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Chat Tim",
      onClick: () => {
        toast.info("Fitur chat segera hadir");
      },
    },
  ];

  return (
    <DashboardLayout role="waiter">
      <div ref={pullToRefresh.containerRef} className="h-full overflow-auto">
        <PullToRefresh
          isPulling={pullToRefresh.isPulling}
          isRefreshing={pullToRefresh.isRefreshing}
          pullDistance={pullToRefresh.pullDistance}
          shouldRefresh={pullToRefresh.shouldRefresh}
        >
          <div className="space-y-6 p-4 md:p-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard Waiter</h2>
              <p className="text-muted-foreground">Kelola pesanan dan tugas ruangan</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : (
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
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xl font-semibold">Ruangan</h3>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : rooms.length > 0 ? (
                  <StaggeredGrid
                    columns={{ default: 1, md: 2, xl: 3 }}
                    className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  >
                    {rooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onClick={() => handleRoomClick(room)}
                      />
                    ))}
                  </StaggeredGrid>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                    <p className="text-lg font-medium mb-2">Tidak ada ruangan tersedia</p>
                    <p className="text-sm text-muted-foreground">
                      Hubungi manager untuk membuat ruangan baru
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <WaiterTaskHistory />
              </div>
            </div>
          </div>
        </PullToRefresh>
      </div>

      <FloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        actions={fabActions}
        position="bottom-right"
      />
      
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
