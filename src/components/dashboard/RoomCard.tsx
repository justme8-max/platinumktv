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
  status: "available" | "occupied" | "maintenance" | "reserved";
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
      className: "bg-green-500 text-white",
    },
    occupied: {
      className: "bg-red-500 text-white",
    },
    maintenance: {
      className: "bg-yellow-500 text-white",
    },
    reserved: {
      className: "bg-blue-500 text-white",
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
          room.status === 'occupied' && 'bg-red-50/50 border-red-200',
          room.status === 'available' && 'bg-green-50/50 border-green-200',
          room.status === 'maintenance' && 'bg-yellow-50/50 border-yellow-200',
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
              <div className="flex items-center gap-2 text-green-600 font-medium bg-green-100 px-3 py-2 rounded-md">
                <Clock className="h-4 w-4" />
                <span>{t('room_card.click_to_start')}</span>
              </div>
            )}
            
            {timeRemaining && (room.status === 'occupied' || room.status === 'reserved') && (
              <div className={cn(
                "flex items-center gap-2 font-semibold",
                isLowTime ? "text-red-600 animate-pulse" : "text-orange-600"
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
