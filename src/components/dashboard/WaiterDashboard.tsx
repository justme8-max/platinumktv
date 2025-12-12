import { useEffect, useState, lazy, Suspense, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDemoMode } from "@/contexts/DemoModeContext";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import { ShoppingCart, Clock, Package, Plus, List, MessageSquare, RefreshCw } from "lucide-react";
import WaiterTaskHistory from "@/components/waiter/WaiterTaskHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredGrid } from "@/components/ui/staggered-grid";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { toast } from "sonner";
import RoomCard from "./RoomCard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_ROOMS, DEMO_STATS } from "@/data/demoData";

const WaiterRoomDetailCard = lazy(() => import("@/components/waiter/WaiterRoomDetailCard"));

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  hourly_rate: number;
  status: "available" | "occupied" | "maintenance" | "reserved" | "cleaning";
  current_session_start?: string;
  waiter_id?: string;
}

interface Stats {
  activeOrders: number;
  occupiedRooms: number;
  pendingItems: number;
}

const WaiterDashboard = memo(function WaiterDashboard() {
  const { t } = useLanguage();
  const { isDemoMode } = useDemoMode();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>(() => isDemoMode ? {
    activeOrders: DEMO_STATS.activeOrders,
    occupiedRooms: DEMO_STATS.occupiedRooms,
    pendingItems: DEMO_STATS.pendingItems,
  } : {
    activeOrders: 0,
    occupiedRooms: 0,
    pendingItems: 0,
  });

  const loadRooms = useCallback(async () => {
    try {
      // Use demo data if demo mode is active
      if (isDemoMode) {
        setRooms(DEMO_ROOMS as Room[]);
        setStats({
          activeOrders: DEMO_STATS.activeOrders,
          occupiedRooms: DEMO_STATS.occupiedRooms,
          pendingItems: DEMO_STATS.pendingItems,
        });
        return;
      }

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      if (error) {
        console.error("Error loading rooms:", error);
        toast.error("Gagal memuat data ruangan");
        return;
      }

      setRooms(data || []);

      // Calculate stats
      const occupied = data?.filter(r => r.status === "occupied").length || 0;
      
      // Get active orders count
      const { data: ordersData, error: ordersError } = await supabase
        .from("fb_orders")
        .select("id, fb_order_items(id)")
        .in("status", ["pending", "preparing"]);
      
      if (!ordersError) {
        const totalItems = ordersData?.reduce((sum, order) => 
          sum + (order.fb_order_items?.length || 0), 0) || 0;
        
        setStats({
          activeOrders: ordersData?.length || 0,
          occupiedRooms: occupied,
          pendingItems: totalItems,
        });
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error("Gagal memuat data");
    }
  }, [isDemoMode]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
    toast.success("Data diperbarui");
  }, [loadRooms]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await loadRooms();
      setLoading(false);
    };
    
    initLoad();

    // Skip realtime subscriptions in demo mode
    if (isDemoMode) return;

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
  }, [loadRooms, isDemoMode]);

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
    setDetailOpen(true);
  }, []);

  const fabActions = useMemo(() => [
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
  ], [rooms, handleRoomClick]);

  // Memoized room grid
  const roomGrid = useMemo(() => {
    if (rooms.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed"
        >
          <p className="text-lg font-medium mb-2">Tidak ada ruangan tersedia</p>
          <p className="text-sm text-muted-foreground mb-4">
            {isDemoMode ? "Data demo kosong" : "Hubungi manager untuk membuat ruangan baru"}
          </p>
          {!isDemoMode && (
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Muat Ulang
            </Button>
          )}
        </motion.div>
      );
    }

    return (
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
    );
  }, [rooms, isDemoMode, handleRoomClick, handleRefresh, refreshing]);

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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dashboard Waiter</h2>
                <p className="text-muted-foreground">Kelola pesanan dan tugas ruangan</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden md:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </motion.div>
              ) : (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Ruangan</h3>
                  <span className="text-sm text-muted-foreground">
                    {rooms.length} ruangan
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading-rooms"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rooms"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {roomGrid}
                    </motion.div>
                  )}
                </AnimatePresence>
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
        {selectedRoom && (
          <WaiterRoomDetailCard
            room={selectedRoom}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
});

export default WaiterDashboard;
