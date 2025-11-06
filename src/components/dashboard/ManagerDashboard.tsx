import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import ApprovalList from "@/components/manager/ApprovalList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingDown, Home, Plus, UserPlus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmployeeDialog from "@/components/employees/EmployeeDialog";
import EmployeeList from "@/components/employees/EmployeeList";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayExpenses: 0,
    occupiedRooms: 0,
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
      setStats(prev => ({ ...prev, occupiedRooms: occupied }));
    }

    // Load today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", today.toISOString());

    if (transactionsData) {
      const total = transactionsData.reduce((sum, t) => sum + Number(t.amount), 0);
      setStats(prev => ({ ...prev, todayRevenue: total }));
    }

    // Load today's expenses
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("amount")
      .eq("expense_date", today.toISOString().split('T')[0]);

    if (expensesData) {
      const total = expensesData.reduce((sum, e) => sum + Number(e.amount), 0);
      setStats(prev => ({ ...prev, todayExpenses: total }));
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
      <DashboardLayout role="manager">
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Management Dashboard</h2>
            <p className="text-muted-foreground">Manage rooms and track operations</p>
          </div>
          <Button className="bg-gradient-primary shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Today's Revenue"
            value={`₱${stats.todayRevenue.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatsCard
            title="Today's Expenses"
            value={`₱${stats.todayExpenses.toLocaleString()}`}
            icon={TrendingDown}
          />
          <StatsCard
            title="Occupied Rooms"
            value={stats.occupiedRooms}
            icon={Home}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActions role="manager" actions={[
            { icon: UserPlus, label: "Tambah Karyawan", onClick: () => setDialogOpen(true), variant: "default" },
            { icon: Plus, label: "Tambah Expense", onClick: () => {}, variant: "default" },
          ]} />
          <div className="lg:col-span-2">
            <RoleSpecificWidget role="manager" />
          </div>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">
              <CheckSquare className="h-4 w-4 mr-2" />
              Persetujuan
            </TabsTrigger>
            <TabsTrigger value="employees">Karyawan</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-4">
            <ApprovalList />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Manajemen Karyawan</h3>
                <p className="text-sm text-muted-foreground">
                  Kelola data karyawan dan lihat ID yang ter-generate otomatis
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Karyawan
              </Button>
            </div>
            <EmployeeList
              employees={employees}
              onEdit={handleEditEmployee}
              onDelete={loadDashboardData}
              canDelete={false}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="bg-card rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">Expense tracking interface coming soon...</p>
            </div>
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
