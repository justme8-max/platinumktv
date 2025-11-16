import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Timer, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ExpandableRoomCardProps {
  room: Room;
  onAddItems?: () => void;
  onExtendTime?: () => void;
}

export default function ExpandableRoomCard({ room, onAddItems, onExtendTime }: ExpandableRoomCardProps) {
  const { t } = useLanguage();
  const { timeRemaining, isLowTime } = useRoomTimer(room.id, room.status);
  const [expanded, setExpanded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const statusConfig = {
    available: { badge: "bg-success text-success-foreground", dot: "bg-success", label: "Tersedia" },
    occupied: { badge: "bg-destructive text-destructive-foreground", dot: "bg-destructive", label: "Terisi" },
    maintenance: { badge: "bg-warning text-warning-foreground", dot: "bg-warning", label: "Maintenance" },
    reserved: { badge: "bg-primary text-primary-foreground", dot: "bg-primary", label: "Reserved" },
    cleaning: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", label: "Cleaning" },
  };

  const statusInfo = statusConfig[room.status];

  const loadOrders = async () => {
    if (!expanded) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fb_orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          fb_order_items(
            id,
            quantity,
            unit_price,
            products(name_id, name_en)
          )
        `)
        .eq("room_id", room.id)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandChange = (isExpanded: boolean) => {
    setExpanded(isExpanded);
    if (isExpanded) {
      loadOrders();
    }
  };

  return (
    <ExpandableCard
      expanded={expanded}
      onExpandChange={handleExpandChange}
      className="border-border bg-card"
      trigger={
        <div>
          <div className="bg-secondary text-secondary-foreground p-3 md:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={cn("w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse", statusInfo.dot)} />
              <div>
                <h3 className="font-bold text-sm md:text-base">{room.room_name}</h3>
                <p className="text-xs opacity-90">{room.room_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", statusInfo.badge)}>{statusInfo.label}</Badge>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", expanded && "rotate-180")} />
            </div>
          </div>

          <div className="p-3 md:p-4 space-y-2 md:space-y-3 bg-card">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="flex items-center gap-1 md:gap-2 text-muted-foreground">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                <span>{t("Kapasitas", "Capacity")}</span>
              </span>
              <span className="font-semibold">{room.capacity} {t("orang", "people")}</span>
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="flex items-center gap-1 md:gap-2 text-muted-foreground">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span>{t("Tarif", "Rate")}</span>
              </span>
              <span className="font-semibold">{formatIDR(room.hourly_rate)}/{t("jam", "hour")}</span>
            </div>

            {room.status === "occupied" && timeRemaining && (
              <div className="flex items-center justify-between text-xs md:text-sm pt-2 border-t">
                <span className="flex items-center gap-1 md:gap-2 text-muted-foreground">
                  <Timer className={cn("w-3 h-3 md:w-4 md:h-4", isLowTime && "text-destructive animate-pulse")} />
                  <span>{t("Waktu Tersisa", "Time Remaining")}</span>
                </span>
                <span className={cn("font-bold", isLowTime && "text-destructive")}>{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {room.status === "occupied" && (
          <div className="flex gap-2">
            <Button onClick={onAddItems} className="flex-1" size="sm">
              {t("Tambah Menu", "Add Menu")}
            </Button>
            <Button onClick={onExtendTime} variant="outline" className="flex-1" size="sm">
              {t("Perpanjang Waktu", "Extend Time")}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            {t("Memuat pesanan...", "Loading orders...")}
          </div>
        ) : orders.length > 0 ? (
          <div>
            <h4 className="font-semibold text-sm mb-2">{t("Pesanan Aktif", "Active Orders")}</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {order.status === "pending" ? t("Menunggu", "Pending") : t("Diproses", "Preparing")}
                      </Badge>
                      <span className="font-semibold">{formatIDR(order.total_amount)}</span>
                    </div>
                    <div className="space-y-1">
                      {order.fb_order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span>{item.quantity}x {item.products?.name_id}</span>
                          <span className="text-muted-foreground">{formatIDR(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          room.status === "occupied" && (
            <div className="text-center text-sm text-muted-foreground py-4">
              {t("Belum ada pesanan", "No orders yet")}
            </div>
          )
        )}
      </div>
    </ExpandableCard>
  );
}
