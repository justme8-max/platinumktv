import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import RoomCard from "./RoomCard";
import RoomDetailDialog from "./RoomDetailDialog";
import AddItemsToRoomDialog from "./AddItemsToRoomDialog";
import ApprovalRequestDialog from "@/components/cashier/ApprovalRequestDialog";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, CreditCard, ShoppingCart, Info, PercentSquare } from "lucide-react";
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

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(transactionsChannel);
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
    try {
      const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!room) return;

      // Calculate duration and amount
      const start = new Date(room.current_session_start);
      const end = new Date();
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const amount = Math.ceil(hours) * room.hourly_rate;

      // Create transaction
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("transactions").insert({
        room_id: roomId,
        cashier_id: user?.id,
        transaction_type: "room_rental",
        amount,
        payment_method: "cash",
        session_start: room.current_session_start,
        session_end: end.toISOString(),
        duration_hours: Math.ceil(hours),
        description: `${room.room_name} - ${Math.ceil(hours)} hours`,
      });

      // Update room status
      await supabase
        .from("rooms")
        .update({
          status: "available",
          current_session_start: null,
        })
        .eq("id", roomId);

      toast.success(t('cashier_dashboard.session_ended', { amount: amount.toLocaleString() }));
      loadDashboardData();
      setDetailDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout role="cashier">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('cashier_dashboard.title')}</h2>
          <p className="text-muted-foreground">{t('cashier_dashboard.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title={t('cashier_dashboard.today_transactions')}
            value={stats.todayTransactions}
            icon={CreditCard}
          />
          <StatsCard
            title={t('cashier_dashboard.today_revenue')}
            value={formatIDR(stats.todayRevenue)}
            icon={DollarSign}
          />
          <StatsCard
            title={t('cashier_dashboard.active_sessions')}
            value={stats.activeRooms}
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActions role="cashier" />
          <div className="lg:col-span-2">
            <RoleSpecificWidget role="cashier" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{t('cashier_dashboard.rooms')}</h3>
            <div className="flex items-center gap-4">
              <DemoDataManager />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovalDialogOpen(true)}
              >
                <PercentSquare className="h-4 w-4 mr-2" />
                {t("approval.requestTitle")}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <p>{t('cashier_dashboard.room_click_hint')}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>
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
    </DashboardLayout>
  );
}
