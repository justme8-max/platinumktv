import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  status: string;
  hourly_rate: number;
  current_session_start: string | null;
}

interface RoomDetailDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function RoomDetailDialog({
  room,
  open,
  onOpenChange,
  onUpdate,
}: RoomDetailDialogProps) {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    if (room && open) {
      calculateDuration();
    }
  }, [room, open]);

  const calculateDuration = () => {
    if (room?.current_session_start) {
      const start = new Date(room.current_session_start);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration(`${hours} jam ${minutes} menit`);
    }
  };

  useEffect(() => {
    const interval = setInterval(calculateDuration, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [room]);

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Detail Ruangan - {room.room_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <Card className="p-4 bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                  {room.status === "occupied" ? "Terisi" : "Tersedia"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarif/Jam</p>
                <p className="font-semibold">Rp {room.hourly_rate.toLocaleString()}</p>
              </div>
              {room.current_session_start && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Durasi</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimasi Biaya</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Rp {(Math.ceil(parseFloat(duration)) * room.hourly_rate).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
