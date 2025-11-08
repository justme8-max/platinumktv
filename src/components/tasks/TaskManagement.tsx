import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  status: string;
}

interface CleaningStaff {
  id: string;
  full_name: string;
}

interface CleaningTask {
  id: string;
  room_id: string;
  assigned_to: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  rooms: {
    room_number: string;
    room_name: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

export default function TaskManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cleaningStaff, setCleaningStaff] = useState<CleaningStaff[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load rooms in maintenance or needing cleaning
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, room_number, room_name, status')
      .order('room_number');

    if (roomsData) setRooms(roomsData);

    // Load cleaning staff (waiters can be cleaning staff)
    const { data: staffRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['waiter', 'waitress']);

    if (staffRoles) {
      const staffIds = staffRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', staffIds);

      if (profiles) setCleaningStaff(profiles);
    }

    // Load existing tasks
    const { data: tasksData } = await supabase
      .from('cleaning_tasks')
      .select(`
        *,
        rooms(room_number, room_name),
        profiles(full_name)
      `)
      .order('created_at', { ascending: false });

    if (tasksData) setTasks(tasksData as any);
  };

  const handleCreateTask = async () => {
    if (!selectedRoom) {
      toast.error("Pilih ruangan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cleaning_tasks')
        .insert({
          room_id: selectedRoom,
          assigned_to: assignedTo || null,
          priority,
          notes,
          assigned_by: user.user?.id
        });

      if (error) throw error;

      toast.success("Tugas pembersihan berhasil dibuat!");
      setSelectedRoom("");
      setAssignedTo("");
      setPriority("normal");
      setNotes("");
      loadData();
    } catch (error: any) {
      toast.error("Gagal membuat tugas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'in_progress') {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('cleaning_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      toast.success("Status tugas diperbarui!");
      loadData();
    } catch (error: any) {
      toast.error("Gagal memperbarui status: " + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Manajemen Tugas Pembersihan
          </CardTitle>
          <CardDescription>
            Kelola dan tugaskan pembersihan ruangan ke staff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ruangan</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruangan" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_name} - {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tugaskan Kepada (Opsional)</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Belum Ditugaskan</SelectItem>
                  {cleaningStaff.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritas</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Catatan</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan khusus..."
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleCreateTask} disabled={loading} className="w-full">
            {loading ? "Membuat Tugas..." : "Buat Tugas Pembersihan"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas Pembersihan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada tugas pembersihan
              </p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {task.rooms.room_name} - Kamar {task.rooms.room_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {task.profiles ? `Ditugaskan: ${task.profiles.full_name}` : 'Belum ditugaskan'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Normal'}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status === 'pending' ? 'Menunggu' : 
                           task.status === 'in_progress' ? 'Dikerjakan' :
                           task.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  {task.notes && (
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  )}

                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          Mulai Kerjakan
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          Selesai
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateTaskStatus(task.id, 'cancelled')}
                      >
                        Batalkan
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
