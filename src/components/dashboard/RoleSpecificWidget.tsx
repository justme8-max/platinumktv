import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users,
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RoleSpecificWidgetProps {
  role: string;
}

export default function RoleSpecificWidget({ role }: RoleSpecificWidgetProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoleData();
  }, [role]);

  const loadRoleData = async () => {
    setLoading(true);
    try {
      switch (role) {
        case 'waiter':
          await loadWaiterData();
          break;
        case 'cashier':
          await loadCashierData();
          break;
        case 'manager':
          await loadManagerData();
          break;
        case 'owner':
          await loadOwnerData();
          break;
        case 'accountant':
          await loadAccountantData();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWaiterData = async () => {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("*")
      .eq("status", "occupied");
    
    const { data: recentSales } = await supabase
      .from("sales_items")
      .select("*, products(*)")
      .order("created_at", { ascending: false })
      .limit(5);

    setData({ occupiedRooms: rooms?.length || 0, recentSales: recentSales || [] });
  };

  const loadCashierData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", today.toISOString());

    const pendingPayments = transactions?.filter(t => t.payment_method === 'cash').length || 0;
    const totalToday = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    setData({ pendingPayments, totalToday, transactionCount: transactions?.length || 0 });
  };

  const loadManagerData = async () => {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .lt("stock_quantity", 10);

    const { data: employees } = await supabase
      .from("employees")
      .select("*");

    setData({ lowStockItems: products?.length || 0, employeeCount: employees?.length || 0 });
  };

  const loadOwnerData = async () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekTransactions } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", weekAgo.toISOString());

    const { data: weekExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .gte("created_at", weekAgo.toISOString());

    const revenue = weekTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expenses = weekExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    setData({ weekRevenue: revenue, weekExpenses: expenses, netProfit: revenue - expenses });
  };

  const loadAccountantData = async () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", monthStart.toISOString());

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .gte("created_at", monthStart.toISOString());

    const monthRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const monthExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    setData({ monthRevenue, monthExpenses, balance: monthRevenue - monthExpenses });
  };

  if (loading) {
    return (
      <Card className="p-6 glass border-border/50 animate-pulse">
        <div className="h-32 bg-muted rounded" />
      </Card>
    );
  }

  const renderContent = () => {
    switch (role) {
      case 'waiter':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t("Ruangan Aktif", "Active Rooms")}</span>
              </div>
              <Badge variant="secondary" className="text-lg">{data?.occupiedRooms}</Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">{t("Pesanan Terbaru", "Recent Orders")}</p>
              <div className="space-y-2">
                {data?.recentSales?.slice(0, 3).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{sale.products?.name_id}</span>
                    <span className="font-medium">x{sale.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cashier':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t("Hari Ini", "Today")}</span>
              </div>
              <Badge variant="default" className="text-lg">Rp {data?.totalToday?.toLocaleString()}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">{t("Transaksi", "Transactions")}</p>
                <p className="text-2xl font-bold">{data?.transactionCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("Pembayaran", "Payments")}</p>
                <p className="text-2xl font-bold">{data?.pendingPayments}</p>
              </div>
            </div>
          </div>
        );

      case 'manager':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">{t("Stok Rendah", "Low Stock")}</span>
              </div>
              <Badge variant="destructive" className="text-lg">{data?.lowStockItems}</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t("Total Karyawan", "Total Employees")}</span>
                </div>
                <span className="text-2xl font-bold">{data?.employeeCount}</span>
              </div>
            </div>
          </div>
        );

      case 'owner':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t("7 Hari Terakhir", "Last 7 Days")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                <p className="text-xs text-muted-foreground">{t("Pendapatan", "Revenue")}</p>
                <p className="text-xl font-bold text-green-600">Rp {data?.weekRevenue?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
                <p className="text-xs text-muted-foreground">{t("Pengeluaran", "Expenses")}</p>
                <p className="text-xl font-bold text-red-600">Rp {data?.weekExpenses?.toLocaleString()}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("Laba Bersih", "Net Profit")}</span>
                <span className="text-2xl font-bold text-primary">Rp {data?.netProfit?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );

      case 'accountant':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t("Bulan Ini", "This Month")}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{t("Pendapatan", "Revenue")}</span>
                <span className="font-bold text-green-600">Rp {data?.monthRevenue?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{t("Pengeluaran", "Expenses")}</span>
                <span className="font-bold text-red-600">Rp {data?.monthExpenses?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-primary">
                <span className="text-sm text-primary-foreground">{t("Saldo", "Balance")}</span>
                <span className="font-bold text-primary-foreground">Rp {data?.balance?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 glass border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-lg">{t("Ringkasan", "Summary")}</h3>
      </div>
      {renderContent()}
    </Card>
  );
}
