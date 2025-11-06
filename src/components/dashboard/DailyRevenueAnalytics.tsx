import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { DollarSign, TrendingUp, CreditCard, Banknote, Smartphone, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentMethodStats {
  method: string;
  total: number;
  count: number;
}

interface RoomStats {
  room_name: string;
  total: number;
}

export default function DailyRevenueAnalytics() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStats[]>([]);
  const [topRooms, setTopRooms] = useState<RoomStats[]>([]);

  useEffect(() => {
    loadDailyStats();

    // Realtime updates
    const channel = supabase
      .channel('daily-revenue-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        () => loadDailyStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDailyStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all today's transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          *,
          rooms (
            room_name
          )
        `)
        .gte("created_at", today.toISOString());

      if (error) throw error;

      if (transactions) {
        // Calculate total stats
        const total = transactions.reduce((sum, t) => sum + Number(t.final_amount || t.amount), 0);
        const count = transactions.length;

        setStats({
          totalRevenue: total,
          totalTransactions: count,
          avgTransaction: count > 0 ? total / count : 0,
        });

        // Group by payment method
        const methodMap = new Map<string, { total: number; count: number }>();
        transactions.forEach(t => {
          const current = methodMap.get(t.payment_method) || { total: 0, count: 0 };
          methodMap.set(t.payment_method, {
            total: current.total + Number(t.final_amount || t.amount),
            count: current.count + 1,
          });
        });

        const methods = Array.from(methodMap.entries()).map(([method, data]) => ({
          method,
          total: data.total,
          count: data.count,
        }));
        setPaymentMethods(methods);

        // Group by room
        const roomMap = new Map<string, number>();
        transactions.forEach(t => {
          if (t.rooms) {
            const current = roomMap.get(t.rooms.room_name) || 0;
            roomMap.set(t.rooms.room_name, current + Number(t.final_amount || t.amount));
          }
        });

        const rooms = Array.from(roomMap.entries())
          .map(([room_name, total]) => ({ room_name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setTopRooms(rooms);
      }
    } catch (error: any) {
      console.error("Error loading daily stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'e_wallet': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu",
      bank_transfer: "Transfer Bank",
      e_wallet: "E-Wallet",
    };
    return labels[method] || method;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          💰 Analitik Omset Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Omset</p>
              <p className="text-2xl font-bold text-green-700">{formatIDR(stats.totalRevenue)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Transaksi</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalTransactions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Rata-rata Transaksi</p>
              <p className="text-2xl font-bold text-purple-700">{formatIDR(stats.avgTransaction)}</p>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div>
            <h4 className="font-semibold mb-3">📊 Pembayaran per Metode</h4>
            <div className="space-y-2">
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada transaksi hari ini
                </p>
              ) : (
                paymentMethods.map((method) => (
                  <div
                    key={method.method}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentMethodIcon(method.method)}
                      <div>
                        <p className="font-medium">{getPaymentMethodLabel(method.method)}</p>
                        <p className="text-xs text-muted-foreground">{method.count} transaksi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatIDR(method.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((method.total / stats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Rooms */}
          {topRooms.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">🏆 Top 5 Ruangan</h4>
              <div className="space-y-2">
                {topRooms.map((room, index) => (
                  <div
                    key={room.room_name}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <p className="font-medium">{room.room_name}</p>
                    </div>
                    <p className="font-bold">{formatIDR(room.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
