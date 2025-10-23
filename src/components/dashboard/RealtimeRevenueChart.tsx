import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

interface RevenueData {
  time: string;
  amount: number;
}

export default function RealtimeRevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [revenuePerSecond, setRevenuePerSecond] = useState(0);

  useEffect(() => {
    loadRevenueData();

    const channel = supabase
      .channel('realtime-revenue')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        () => loadRevenueData()
      )
      .subscribe();

    const interval = setInterval(loadRevenueData, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadRevenueData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: true });

    if (transactions && transactions.length > 0) {
      const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalToday(total);

      const firstTransaction = new Date(transactions[0].created_at);
      const now = new Date();
      const secondsElapsed = Math.max(1, (now.getTime() - firstTransaction.getTime()) / 1000);
      setRevenuePerSecond(total / secondsElapsed);

      const hourlyData: { [key: string]: number } = {};
      
      transactions.forEach((t) => {
        const hour = new Date(t.created_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + Number(t.amount);
      });

      const chartData = Object.entries(hourlyData).map(([time, amount]) => ({
        time,
        amount,
      }));

      setRevenueData(chartData);
    } else {
      setRevenueData([]);
      setTotalToday(0);
      setRevenuePerSecond(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Omset Hari Ini</p>
              <p className="text-2xl font-bold">
                Rp {totalToday.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Omset Per Detik</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                Rp {revenuePerSecond.toFixed(0).toLocaleString('id-ID')}
                <span className="text-sm text-muted-foreground">/detik</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Real-time business flow
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center animate-pulse">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Grafik Omset Hari Ini</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" style={{ fontSize: '12px' }} />
              <YAxis 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Belum ada transaksi hari ini
          </div>
        )}
      </Card>
    </div>
  );
}
