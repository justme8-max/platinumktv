import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, Building2, UserPlus, Package, ShoppingCart } from "lucide-react";
import EmployeeDialog from "@/components/employees/EmployeeDialog";
import EmployeeList from "@/components/employees/EmployeeList";
import RealtimeRevenueChart from "./RealtimeRevenueChart";
import OwnerRevenueChart from "./OwnerRevenueChart";
import ProductList from "@/components/inventory/ProductList";
import ProductDialog from "@/components/inventory/ProductDialog";
import PurchaseOrderList from "@/components/purchase/PurchaseOrderList";
import BestSellersChart from "@/components/analytics/BestSellersChart";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { formatIDR } from "@/lib/currency";
import UserRoleManagement from "@/components/admin/UserRoleManagement";
import WaiterAssignment from "@/components/admin/WaiterAssignment";

export default function OwnerDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    revenue: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    dailyGrowth: 0,
    monthlyGrowth: 0,
    yearlyGrowth: 0,
    rooms: 0,
    activeUsers: 0,
    occupancy: 0,
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

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

    // Load revenue with different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    // Daily revenue (today)
    const { data: todayData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", today.toISOString());

    // Yesterday revenue
    const { data: yesterdayData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    // Monthly revenue
    const { data: monthData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", thisMonthStart.toISOString());

    // Last month revenue
    const { data: lastMonthData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    // Yearly revenue
    const { data: yearData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", thisYearStart.toISOString());

    // Last year revenue
    const { data: lastYearData } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", lastYearStart.toISOString())
      .lte("created_at", lastYearEnd.toISOString());

    const todayTotal = todayData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const yesterdayTotal = yesterdayData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const monthTotal = monthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const lastMonthTotal = lastMonthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const yearTotal = yearData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const lastYearTotal = lastYearData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const dailyGrowth = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const monthlyGrowth = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const yearlyGrowth = lastYearTotal > 0 ? ((yearTotal - lastYearTotal) / lastYearTotal) * 100 : 0;

    setStats(prev => ({
      ...prev,
      revenue: monthTotal,
      dailyRevenue: todayTotal,
      monthlyRevenue: monthTotal,
      yearlyRevenue: yearTotal,
      dailyGrowth,
      monthlyGrowth,
      yearlyGrowth,
    }));

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

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
    setEditProduct(null);
  };

  const handleEditProduct = (product: any) => {
    setEditProduct(product);
    setProductDialogOpen(true);
  };

  return (
    <>
      <DashboardLayout role="owner">
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("Dashboard Owner", "Owner Dashboard")}</h2>
            <p className="text-muted-foreground">{t("Gambaran lengkap bisnis Anda", "Complete business overview")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Large Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Omset Hari Ini</h3>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <p className="text-5xl font-bold mb-3">{formatIDR(stats.dailyRevenue)}</p>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${stats.dailyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${stats.dailyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.dailyGrowth >= 0 ? '+' : ''}{stats.dailyGrowth.toFixed(1)}% vs kemarin
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background border-2 border-blue-500/20 rounded-xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Omset Bulan Ini</h3>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-5xl font-bold mb-3">{formatIDR(stats.monthlyRevenue)}</p>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% vs bulan lalu
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-background border-2 border-purple-500/20 rounded-xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Omset Tahun Ini</h3>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-5xl font-bold mb-3">{formatIDR(stats.yearlyRevenue)}</p>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${stats.yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${stats.yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.yearlyGrowth >= 0 ? '+' : ''}{stats.yearlyGrowth.toFixed(1)}% vs tahun lalu
              </span>
            </div>
          </div>
        </div>

        {/* Smaller Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActions role="owner" />
          <div className="lg:col-span-2">
            <RoleSpecificWidget role="owner" />
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">{t("Analitik", "Analytics")}</TabsTrigger>
            <TabsTrigger value="bestsellers">{t("Best Sellers", "Best Sellers")}</TabsTrigger>
            <TabsTrigger value="inventory">{t("Inventory", "Inventory")}</TabsTrigger>
            <TabsTrigger value="purchasing">{t("Purchasing", "Purchasing")}</TabsTrigger>
            <TabsTrigger value="employees">{t("Karyawan", "Employees")}</TabsTrigger>
            <TabsTrigger value="waiters">{t("Penugasan Pelayan", "Waiter Assignment")}</TabsTrigger>
            <TabsTrigger value="roles">{t("User Roles", "User Roles")}</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <OwnerRevenueChart />
            <RealtimeRevenueChart />
          </TabsContent>

          <TabsContent value="bestsellers" className="space-y-4">
            <BestSellersChart />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ProductList 
              onAdd={() => setProductDialogOpen(true)}
              onEdit={handleEditProduct}
            />
          </TabsContent>

          <TabsContent value="purchasing" className="space-y-4">
            <PurchaseOrderList 
              onAdd={() => setPurchaseDialogOpen(true)}
              userRole="owner"
            />
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
              onDelete={loadDashboardData}
              canDelete={true}
            />
          </TabsContent>

          <TabsContent value="waiters" className="space-y-4">
            <WaiterAssignment />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <UserRoleManagement />
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

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={handleProductDialogClose}
        onSuccess={loadDashboardData}
        product={editProduct}
      />
    </>
  );
}
