import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Timer, Info, UserCircle, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import { useState, useEffect } from "react";
import RoomTransactionHistory from "./RoomTransactionHistory";
import { supabase } from "@/integrations/supabase/client";

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

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const { t } = useLanguage();
  const { timeRemaining, isLowTime } = useRoomTimer(room.id, room.status);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [waiterName, setWaiterName] = useState<string | null>(null);
  const [waiterBusy, setWaiterBusy] = useState(false);

  useEffect(() => {
    const fetchWaiterInfo = async () => {
      if (room.waiter_id) {
        // Get waiter name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', room.waiter_id)
          .single();
        
        if (profile) {
          setWaiterName(profile.full_name);
        }

        // Check if waiter is busy (assigned to occupied rooms)
        const { data: assignments } = await supabase
          .from('rooms')
          .select('status')
          .eq('waiter_id', room.waiter_id)
          .eq('status', 'occupied');
        
        setWaiterBusy((assignments?.length || 0) > 0);
      }
    };

    fetchWaiterInfo();
  }, [room.waiter_id]);

  const statusConfig = {
    available: {
      badge: "bg-success text-success-foreground",
      dot: "bg-success",
      label: "Tersedia",
    },
    occupied: {
      badge: "bg-destructive text-destructive-foreground",
      dot: "bg-destructive",
      label: "Terisi",
    },
    maintenance: {
      badge: "bg-warning text-warning-foreground",
      dot: "bg-warning",
      label: "Maintenance",
    },
    reserved: {
      badge: "bg-primary text-primary-foreground",
      dot: "bg-primary",
      label: "Reserved",
    },
    cleaning: {
      badge: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
      label: "Cleaning",
    },
  };
  
  const statusInfo = statusConfig[room.status];

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryOpen(true);
  };

  return (
    <>
      <Card 
        className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden rounded-xl bg-white/80 backdrop-blur border border-border"
        onClick={onClick}
      >
        {/* Header - Secondary Color */}
        <div className="bg-secondary text-secondary-foreground p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="font-semibold text-base md:text-lg tracking-wide">
            {room.room_name}
          </h3>
          
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Timer className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-mono text-xs md:text-sm tracking-wider">
              {timeRemaining || "00 : 00 : 00"}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-xs md:text-sm font-semibold tracking-wide">{statusInfo.label}</span>
            <div className={cn("h-2.5 w-2.5 md:h-3 md:w-3 rounded-full", statusInfo.dot)} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <CardContent className="p-4 md:p-6 bg-gradient-to-br from-muted/30 to-muted/10 min-h-[160px] md:min-h-[180px]">
            <div className="space-y-2 md:space-y-3">
              {/* Room Details */}
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground flex-wrap">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">{t('room_card.guests', { count: room.capacity })}</span>
                <span className="text-muted-foreground">•</span>
                <span className="capitalize text-xs md:text-sm">{room.room_type}</span>
              </div>

              {/* Room Number */}
              <div className="text-xs md:text-sm text-muted-foreground">
                {t('room_card.room')} {room.room_number}
              </div>

              {/* Waiter Assignment */}
              {waiterName && (
                <div className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm",
                  waiterBusy 
                    ? "bg-destructive/20 text-destructive-foreground" 
                    : "bg-success/20 text-success-foreground"
                )}>
                  <UserCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="truncate">{waiterName}</span>
                  <span className={cn(
                    "ml-auto text-xs px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap",
                    waiterBusy ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
                  )}>
                    {waiterBusy ? "Sibuk" : "Tersedia"}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                <div className="font-semibold text-base md:text-lg text-primary tracking-wide">
                  {formatIDR(room.hourly_rate)}/{t('room_card.hour')}
                </div>
              </div>
            </div>

            {/* Decorative Pattern - Bottom Right */}
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                </pattern>
                <rect width="100" height="100" fill="url(#pattern)" />
              </svg>
            </div>
          </CardContent>

          {/* Action Buttons - Right Side */}
          <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-3">
            <Button
              size="icon"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:shadow-glow"
              onClick={onClick}
            >
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              size="icon"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg transition-all"
              onClick={handleInfoClick}
            >
              <Receipt className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <RoomTransactionHistory
        roomId={room.id}
        roomName={room.room_name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
