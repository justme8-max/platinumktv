import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCircle, Save } from "lucide-react";

interface Waiter {
  id: string;
  full_name: string;
}

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  waiter_id: string | null;
}

export default function WaiterAssignment() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load waiters (users with waiter role)
    const { data: waiterRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'waiter');

    if (waiterRoles) {
      const waiterIds = waiterRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', waiterIds);

      if (profiles) {
        setWaiters(profiles);
      }
    }

    // Load rooms
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, room_number, room_name, waiter_id')
      .order('room_number');

    if (roomsData) {
      setRooms(roomsData);
      
      // Initialize assignments from current data
      const currentAssignments: Record<string, string> = {};
      roomsData.forEach(room => {
        if (room.waiter_id) {
          currentAssignments[room.id] = room.waiter_id;
        }
      });
      setAssignments(currentAssignments);
    }
  };

  const handleAssignmentChange = (roomId: string, waiterId: string) => {
    setAssignments(prev => ({
      ...prev,
      [roomId]: waiterId
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all room assignments
      const updates = Object.entries(assignments).map(([roomId, waiterId]) => 
        supabase
          .from('rooms')
          .update({ waiter_id: waiterId || null })
          .eq('id', roomId)
      );

      await Promise.all(updates);
      toast.success("Penugasan pelayan berhasil disimpan!");
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan penugasan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Penugasan Pelayan ke Ruangan
        </CardTitle>
        <CardDescription>
          Tetapkan pelayan untuk setiap ruangan. Status akan otomatis update (hijau=free, merah=sibuk)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="p-4 border rounded-lg space-y-2">
              <div className="font-semibold">{room.room_name}</div>
              <div className="text-sm text-muted-foreground">Kamar {room.room_number}</div>
              <Select
                value={assignments[room.id] || ""}
                onValueChange={(value) => handleAssignmentChange(room.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelayan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak Ada</SelectItem>
                  {waiters.map(waiter => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Penugasan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}