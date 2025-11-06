import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Timer, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import { useState } from "react";
import RoomTransactionHistory from "./RoomTransactionHistory";

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  hourly_rate: number;
  status: "available" | "occupied" | "maintenance" | "reserved" | "cleaning";
  current_session_start?: string;
}

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const { t } = useLanguage();
  const { timeRemaining, isLowTime } = useRoomTimer(room.id, room.status);
  const [historyOpen, setHistoryOpen] = useState(false);

  const statusConfig = {
    available: {
      className: "bg-success text-success-foreground",
      cardBg: "bg-success/10 border-success/30",
    },
    occupied: {
      className: "bg-destructive text-destructive-foreground",
      cardBg: "bg-destructive/10 border-destructive/30",
    },
    maintenance: {
      className: "bg-warning text-warning-foreground",
      cardBg: "bg-warning/10 border-warning/30",
    },
    reserved: {
      className: "bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))]",
      cardBg: "bg-[hsl(var(--gold))]/10 border-[hsl(var(--gold))]/30",
    },
    cleaning: {
      className: "bg-[hsl(var(--platinum))] text-[hsl(var(--platinum-foreground))]",
      cardBg: "bg-[hsl(var(--platinum))]/10 border-[hsl(var(--platinum))]/30",
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
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 relative",
          onClick && "hover:border-primary/50",
          statusInfo.cardBg
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Info Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-primary/10"
            onClick={handleInfoClick}
          >
            <Info className="h-4 w-4" />
          </Button>

          <div className="flex items-start justify-between mb-3 pr-8">
            <div>
              <h3 className="font-bold text-lg">{room.room_name}</h3>
              <p className="text-sm text-muted-foreground">{t('room_card.room')} {room.room_number}</p>
            </div>
            <Badge className={cn("text-xs", statusInfo.className)}>
               {t(`room_status.${room.status}`)}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t('room_card.guests', { count: room.capacity })}</span>
              <span className="text-muted-foreground">•</span>
              <span className="capitalize">{room.room_type}</span>
            </div>
            
            {room.status === 'available' && (
              <div className="flex items-center gap-2 text-success-foreground font-medium bg-success/20 px-3 py-2 rounded-md">
                <Clock className="h-4 w-4" />
                <span>{t('room_card.click_to_start')}</span>
              </div>
            )}
            
            {timeRemaining && (room.status === 'occupied' || room.status === 'reserved') && (
              <div className={cn(
                "flex items-center gap-2 font-semibold",
                isLowTime ? "text-destructive animate-pulse" : "text-warning"
              )}>
                <Timer className="h-4 w-4" />
                <span>{t('room_card.time_remaining')}: {timeRemaining}</span>
              </div>
            )}
            
             <div className="flex items-center justify-between pt-2 border-t">
              <div className="font-semibold text-primary">
                {formatIDR(room.hourly_rate)}/{t('room_card.hour')}
              </div>
            </div>
          </div>
        </CardContent>
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
