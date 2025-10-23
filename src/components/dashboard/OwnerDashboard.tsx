import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import RoomCard from "./RoomCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, Building2, UserPlus } from "lucide-react";
import EmployeeDialog from "@/components/employees/EmployeeDialog";
import EmployeeList from "@/components/employees/EmployeeList";
import RealtimeRevenueChart from "./RealtimeRevenueChart";

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    rooms: 0,
    activeUsers: 0,
    occupancy: 0,
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load rooms
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");

    if (roomsData) {
      setRooms(roomsData);
      const occupied = roomsData.filter(r => r.status === "occupied").length;
      const occupancyRate = (occupied / roomsData.length) * 100;
      
      setStats(prev => ({
        ...prev,
        rooms: roomsData.length,
        occupancy: Math.round(occupancyRate),
      }));
    }

    // Load revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (transactionsData) {
      const total = transactionsData.reduce((sum, t) => sum + Number(t.amount), 0);
      setStats(prev => ({ ...prev, revenue: total }));
    }

    // Load active users count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (count) {
      setStats(prev => ({ ...prev, activeUsers: count }));
    }

    // Load employees
    const { data: employeesData } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (employeesData) {
      setEmployees(employeesData);
    }
  };

  const handleEditEmployee = (employee: any) => {
    setEditEmployee(employee);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditEmployee(null);
  };

  return (
    <>
      <DashboardLayout role="owner">
        <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard Owner</h2>
          <p className="text-muted-foreground">Gambaran lengkap bisnis Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Omset (30 Hari)"
            value={`Rp ${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatsCard
            title="Total Ruangan"
            value={stats.rooms}
            icon={Building2}
          />
          <StatsCard
            title="Tingkat Okupansi"
            value={`${stats.occupancy}%`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Karyawan Aktif"
            value={stats.activeUsers}
            icon={Users}
          />
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analitik Real-time</TabsTrigger>
            <TabsTrigger value="rooms">Ruangan</TabsTrigger>
            <TabsTrigger value="employees">Karyawan</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <RealtimeRevenueChart />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Manajemen Karyawan</h3>
              <Button onClick={() => setDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Karyawan
              </Button>
            </div>
            <EmployeeList
              employees={employees}
              onEdit={handleEditEmployee}
            />
          </TabsContent>
        </Tabs>
        </div>
      </DashboardLayout>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={loadDashboardData}
        employee={editEmployee}
      />
    </>
  );
}
