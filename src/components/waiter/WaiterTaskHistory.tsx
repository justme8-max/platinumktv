import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Task {
  id: string;
  room_id: string;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  rooms: {
    room_number: string;
    room_name: string;
  };
}

export default function WaiterTaskHistory() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
    
    const channel = supabase
      .channel('waiter-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cleaning_tasks')
      .select(`
        *,
        rooms(room_number, room_name)
      `)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setTasks(data as any);
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
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

    if (error) {
      toast.error("Gagal memperbarui status");
    } else {
      toast.success("Status tugas diperbarui");
      loadTasks();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10">Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-primary/10">Sedang Dikerjakan</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>;
      case 'normal':
        return <Badge variant="outline">Normal</Badge>;
      case 'low':
        return <Badge variant="secondary">Rendah</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Riwayat Tugas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada tugas
              </p>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{task.rooms.room_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.rooms.room_number}
                        </p>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    {task.notes && (
                      <p className="text-sm text-muted-foreground">{task.notes}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      {getStatusBadge(task.status)}
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(task.id, 'in_progress')}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Mulai
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(task.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selesai
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
