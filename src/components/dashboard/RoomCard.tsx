import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

const statusConfig = {
  available: {
    label: "Available",
    className: "bg-success text-success-foreground hover:bg-success/90",
  },
  occupied: {
    label: "Occupied",
    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-warning text-warning-foreground hover:bg-warning/90",
  },
  reserved: {
    label: "Reserved",
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
};

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const statusInfo = statusConfig[room.status];

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        onClick && "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">{room.room_name}</h3>
            <p className="text-sm text-muted-foreground">Room {room.room_number}</p>
          </div>
          <Badge className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{room.capacity} guests</span>
            <span className="text-muted-foreground">•</span>
            <span className="capitalize text-muted-foreground">{room.room_type}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">₱{room.hourly_rate}/hr</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
