import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { useRoomTimer } from "@/hooks/useRoomTimer";

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
  const { timeRemaining } = useRoomTimer(room.id, room.status);

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

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        onClick && "hover:border-primary/50",
        room.status === 'occupied' && 'bg-red-50/50 border-red-200',
        room.status === 'available' && 'bg-green-50/50 border-green-200',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
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
          
          {timeRemaining && (room.status === 'occupied' || room.status === 'reserved') && (
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
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
  );
}
