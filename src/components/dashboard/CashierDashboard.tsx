import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import TaskManagement from "@/components/tasks/TaskManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomCard from "./RoomCard";
import RoomDetailDialog from "./RoomDetailDialog";
import AddItemsToRoomDialog from "./AddItemsToRoomDialog";
import ApprovalRequestDialog from "@/components/cashier/ApprovalRequestDialog";
import PaymentDialog from "./PaymentDialog";
import ShiftManagementDialog from "@/components/cashier/ShiftManagementDialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PercentSquare } from "lucide-react";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { formatIDR } from "@/lib/currency";
import DemoDataManager from "@/components/admin/DemoDataManager";

export default function CashierDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    todayTransactions: 0,
    todayRevenue: 0,
    activeRooms: 0,
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Setup realtime subscriptions
    const roomsChannel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => loadDashboardData()
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        () => loadDashboardData()
      )
      .subscribe();

    // Real-time order notifications
    const salesChannel = supabase
      .channel('sales-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_items',
        },
        async (payload) => {
          console.log('New order item:', payload);
          
          // Get product name and room info
          const { data: item } = await supabase
            .from('sales_items')
            .select(`
              quantity,
              products (name_id),
              transactions (
                room_id,
                rooms (room_name)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (item && item.transactions?.rooms) {
            toast.success(
              `🔔 Pesanan Baru di ${item.transactions.rooms.room_name}`,
              {
                description: `${item.quantity}x ${item.products.name_id}`,
                duration: 5000,
              }
            );
          }

          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    // Load rooms
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    if (roomsData) {
      setRooms(roomsData);
      const active = roomsData.filter(r => r.status === "occupied").length;
      setStats(prev => ({ ...prev, activeRooms: active }));
    }

    // Load today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", today.toISOString());

    if (transactionsData) {
      const total = transactionsData.reduce((sum, t) => sum + Number(t.amount), 0);
      setStats(prev => ({
        ...prev,
        todayTransactions: transactionsData.length,
        todayRevenue: total,
      }));
    }
  };

  const handleRoomClick = async (room: any) => {
    setSelectedRoom(room);
    
    // If room is available, start session immediately
    if (room.status === 'available') {
      try {
        await startRoomSession(room.id);
        // Reload the updated room data
        const { data: updatedRoom } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", room.id)
          .single();
        
        if (updatedRoom) {
          setSelectedRoom(updatedRoom);
        }
      } catch (error) {
        // Error already handled by startRoomSession
      }
    }
    
    setDetailDialogOpen(true);
  };

  const handleAddItems = (room: any) => {
    setSelectedRoom(room);
    setAddItemsOpen(true);
  };

  const startRoomSession = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({
          status: "occupied",
          current_session_start: new Date().toISOString(),
        })
        .eq("id", roomId);

      if (error) throw error;

      toast.success(t('cashier_dashboard.room_session_started'));
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const endRoomSession = async (roomId: string) => {
    // Open payment dialog instead of directly ending session
    setPaymentDialogOpen(true);
  };

  return (
    <DashboardLayout role="cashier">
      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms">Ruangan</TabsTrigger>
          <TabsTrigger value="tasks">Tugas Cleaning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rooms" className="space-y-4">
      <div className="space-y-4 md:space-y-6">
        <div className="px-2 md:px-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('cashier_dashboard.title')}</h2>
          <p className="text-sm md:text-base text-muted-foreground">{t('cashier_dashboard.description')}</p>
        </div>

        <div className="px-2 md:px-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              {t('cashier_dashboard.rooms')}
              {rooms.length === 0 && (
                <span className="text-xs md:text-sm font-normal text-muted-foreground">
                  (Kosong - Gunakan "Demo Data" untuk mengisi)
                </span>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <ShiftManagementDialog />
              <DemoDataManager />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovalDialogOpen(true)}
              >
                <PercentSquare className="h-4 w-4 mr-2" />
                {t("approval.requestTitle")}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="col-span-full text-center py-8 md:py-12 bg-muted/30 rounded-lg border-2 border-dashed mx-2 md:mx-0">
              <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-base md:text-lg font-medium mb-2">Tidak ada data ruangan</p>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 px-4">
                Klik tombol "Demo Data" di atas untuk mengisi data demo<br className="hidden md:block" />
                (Login sebagai Owner/Manager untuk seed demo data)
              </p>
            </div>
          )}
        </div>
      </div>

      <RoomDetailDialog
        room={selectedRoom}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={loadDashboardData}
        onAddItems={() => handleAddItems(selectedRoom)}
        onEndSession={() => endRoomSession(selectedRoom.id)}
      />

       <AddItemsToRoomDialog
        room={selectedRoom}
        open={addItemsOpen}
        onOpenChange={setAddItemsOpen}
        onUpdate={() => {
          loadDashboardData();
          setDetailDialogOpen(false);
        }}
      />

      <ApprovalRequestDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        roomId={selectedRoom?.id}
      />

      <PaymentDialog
        room={selectedRoom}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          loadDashboardData();
          setDetailDialogOpen(false);
        }}
      />
      </TabsContent>
      
      <TabsContent value="tasks">
        <TaskManagement />
      </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
