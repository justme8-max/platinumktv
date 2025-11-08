import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import WaiterPOS from "@/components/waiter/WaiterPOS";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomCard from "./RoomCard";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import StatsCard from "./StatsCard";
import { ShoppingCart, Clock, Package } from "lucide-react";
import AddItemsToRoomDialog from "./AddItemsToRoomDialog";

export default function WaiterDashboard() {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
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
    setAddItemsOpen(true);
  };

  return (
    <DashboardLayout role="waiter">
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">F&B Orders</TabsTrigger>
          <TabsTrigger value="rooms">Ruangan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <WaiterPOS />
        </TabsContent>
        
        <TabsContent value="rooms" className="space-y-4">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("Dashboard Waiter/Waitress", "Waiter/Waitress Dashboard")}</h2>
            <p className="text-muted-foreground">{t("Kelola pesanan ruangan", "Manage room orders")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title={t("Pesanan Aktif", "Active Orders")}
              value={stats.activeOrders}
              icon={ShoppingCart}
            />
            <StatsCard
              title={t("Ruangan Terisi", "Occupied Rooms")}
              value={stats.occupiedRooms}
              icon={Clock}
            />
            <StatsCard
              title={t("Item Dipesan", "Items Ordered")}
              value={stats.pendingItems}
              icon={Package}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickActions role="waiter" />
            <div className="lg:col-span-2">
              <RoleSpecificWidget role="waiter" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">
              {t("Ruangan", "Rooms")}
              {rooms.length === 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Kosong - Gunakan "Demo Data" untuk mengisi)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <p className="text-lg font-medium mb-2">Tidak ada data ruangan</p>
                <p className="text-sm text-muted-foreground">
                  Login sebagai Owner/Manager → Klik "Demo Data" → Seed Demo Data
                </p>
              </div>
            )}
          </div>
        </div>
        
        <AddItemsToRoomDialog
          room={selectedRoom}
          open={addItemsOpen}
          onOpenChange={setAddItemsOpen}
          onSuccess={loadRooms}
        />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
