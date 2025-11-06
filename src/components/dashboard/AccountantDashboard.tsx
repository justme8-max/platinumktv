import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "./DashboardLayout";
import StatsCard from "./StatsCard";
import QuickActions from "./QuickActions";
import RoleSpecificWidget from "./RoleSpecificWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import ExportButton from "@/components/common/ExportButton";
import { formatIDR } from "@/lib/currency";

export default function AccountantDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    lowStockItems: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load revenue
    const { data: transData } = await supabase
      .from("transactions")
      .select("amount");
    
    const revenue = transData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Load expenses
    const { data: expData } = await supabase
      .from("expenses")
      .select("amount");
    
    const expenses = expData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Load low stock items
    const { data: products } = await supabase
      .from("products")
      .select("*");
    
    const lowStockItems = products?.filter(p => p.stock_quantity <= p.min_stock_level) || [];

    // Load transactions with details
    const { data: fullTrans } = await supabase
      .from("transactions")
      .select("*, profiles:cashier_id(full_name), rooms(room_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    // Load stock movements
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("*, products(name_id), profiles:created_by(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    setStats({
      revenue,
      expenses,
      netProfit: revenue - expenses,
      lowStockItems: lowStockItems.length,
    });
    
    setTransactions(fullTrans || []);
    setStockMovements(movements || []);
  };

  return (
    <DashboardLayout role="accountant">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t("Dashboard Akuntan", "Accountant Dashboard")}</h2>
          <p className="text-muted-foreground">{t("Analisis keuangan dan stok", "Financial and inventory analysis")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title={t("Total Pendapatan", "Total Revenue")}
            value={formatIDR(stats.revenue)}
            icon={DollarSign}
          />
          <StatsCard
            title={t("Total Pengeluaran", "Total Expenses")}
            value={formatIDR(stats.expenses)}
            icon={TrendingUp}
          />
          <StatsCard
            title={t("Laba Bersih", "Net Profit")}
            value={formatIDR(stats.netProfit)}
            icon={DollarSign}
          />
          <StatsCard
            title={t("Stok Menipis", "Low Stock")}
            value={stats.lowStockItems}
            icon={AlertTriangle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActions role="accountant" />
          <div className="lg:col-span-2">
            <RoleSpecificWidget role="accountant" />
          </div>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">{t("Transaksi", "Transactions")}</TabsTrigger>
            <TabsTrigger value="stock">{t("Pergerakan Stok", "Stock Movements")}</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t("Riwayat Transaksi", "Transaction History")}</h3>
              <ExportButton
                data={transactions}
                filename="transactions"
                headers={["created_at", "amount", "transaction_type", "payment_method"]}
              />
            </div>
            <Card className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((trans) => (
                  <div key={trans.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{trans.rooms?.room_name || trans.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trans.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">{formatIDR(trans.amount)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{t("Pergerakan Stok", "Stock Movements")}</h3>
              <ExportButton
                data={stockMovements}
                filename="stock_movements"
                headers={["created_at", "movement_type", "quantity", "notes"]}
              />
            </div>
            <Card className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stockMovements.map((move) => (
                  <div key={move.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{move.products?.name_id}</p>
                      <p className="text-sm text-muted-foreground">{move.movement_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(move.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className={`font-semibold ${move.quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {move.quantity > 0 ? '+' : ''}{move.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
