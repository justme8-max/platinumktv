import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import RoomCard from "./RoomCard";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddItemsToRoomDialog from "./AddItemsToRoomDialog";

export default function WaiterDashboard() {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [addItemsOpen, setAddItemsOpen] = useState(false);

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
      .eq("status", "occupied")
      .order("room_number");

    setRooms(data || []);
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setAddItemsOpen(true);
  };

  return (
    <>
      <DashboardLayout role="waiter">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("Dashboard Waiter/Waitress", "Waiter/Waitress Dashboard")}</h2>
            <p className="text-muted-foreground">{t("Kelola pesanan ruangan", "Manage room orders")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickActions role="waiter" />
            <div className="lg:col-span-2">
              <RoleSpecificWidget role="waiter" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">{t("Ruangan Terisi", "Occupied Rooms")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <div key={room.id} onClick={() => handleRoomClick(room)} className="cursor-pointer">
                  <RoomCard room={room} />
                  <Button className="w-full mt-2" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("Tambah Pesanan", "Add Order")}
                  </Button>
                </div>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {t("Tidak ada ruangan yang terisi saat ini", "No occupied rooms at the moment")}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {selectedRoom && (
        <AddItemsToRoomDialog
          open={addItemsOpen}
          onOpenChange={setAddItemsOpen}
          room={selectedRoom}
          onUpdate={loadRooms}
        />
      )}
    </>
  );
}
