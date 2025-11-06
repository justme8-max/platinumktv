import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/currency";
import { TrendingUp, Calendar } from "lucide-react";

type TimePeriod = "day" | "week" | "month" | "year";

export default function OwnerRevenueChart() {
  const [period, setPeriod] = useState<TimePeriod>("day");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [period]);

  const loadChartData = async () => {
    setLoading(true);
    const now = new Date();
    let startDate: Date;
    let groupBy: string;
    let dataPoints: any[] = [];

    switch (period) {
      case "day":
        // Last 24 hours, grouped by hour
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data: hourlyData } = await supabase
          .from("transactions")
          .select("amount, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at");

        if (hourlyData) {
          const hourMap = new Map();
          for (let i = 0; i < 24; i++) {
            const hour = new Date(startDate.getTime() + i * 60 * 60 * 1000);
            hourMap.set(hour.getHours(), { hour: `${hour.getHours()}:00`, revenue: 0 });
          }

          hourlyData.forEach((t) => {
            const hour = new Date(t.created_at).getHours();
            if (hourMap.has(hour)) {
              hourMap.get(hour).revenue += Number(t.amount);
            }
          });

          dataPoints = Array.from(hourMap.values());
        }
        break;

      case "week":
        // Last 7 days
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const { data: weeklyData } = await supabase
          .from("transactions")
          .select("amount, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at");

        if (weeklyData) {
          const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          const dayMap = new Map();
          
          for (let i = 0; i < 7; i++) {
            const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dayKey = day.toISOString().split('T')[0];
            dayMap.set(dayKey, { 
              date: dayNames[day.getDay()], 
              revenue: 0 
            });
          }

          weeklyData.forEach((t) => {
            const dayKey = t.created_at.split('T')[0];
            if (dayMap.has(dayKey)) {
              dayMap.get(dayKey).revenue += Number(t.amount);
            }
          });

          dataPoints = Array.from(dayMap.values());
        }
        break;

      case "month":
        // Last 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const { data: monthlyData } = await supabase
          .from("transactions")
          .select("amount, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at");

        if (monthlyData) {
          const dateMap = new Map();
          
          for (let i = 0; i < 30; i++) {
            const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = `${day.getDate()}/${day.getMonth() + 1}`;
            const dayKey = day.toISOString().split('T')[0];
            dateMap.set(dayKey, { date: dateStr, revenue: 0 });
          }

          monthlyData.forEach((t) => {
            const dayKey = t.created_at.split('T')[0];
            if (dateMap.has(dayKey)) {
              dateMap.get(dayKey).revenue += Number(t.amount);
            }
          });

          dataPoints = Array.from(dateMap.values());
        }
        break;

      case "year":
        // Last 12 months
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        
        const { data: yearlyData } = await supabase
          .from("transactions")
          .select("amount, created_at")
          .gte("created_at", startDate.toISOString())
          .order("created_at");

        if (yearlyData) {
          const monthMap = new Map();
          
          for (let i = 0; i < 12; i++) {
            const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
            const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
            monthMap.set(monthKey, { 
              month: monthNames[month.getMonth()], 
              revenue: 0 
            });
          }

          yearlyData.forEach((t) => {
            const date = new Date(t.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthMap.has(monthKey)) {
              monthMap.get(monthKey).revenue += Number(t.amount);
            }
          });

          dataPoints = Array.from(monthMap.values());
        }
        break;
    }

    setChartData(dataPoints);
    setLoading(false);
  };

  const getTotalRevenue = () => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  };

  const getXAxisKey = () => {
    switch (period) {
      case "day": return "hour";
      case "week": return "date";
      case "month": return "date";
      case "year": return "month";
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Grafik Pendapatan</CardTitle>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="day">Hari</TabsTrigger>
              <TabsTrigger value="week">Minggu</TabsTrigger>
              <TabsTrigger value="month">Bulan</TabsTrigger>
              <TabsTrigger value="year">Tahun</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <p className="text-2xl font-bold">{formatIDR(getTotalRevenue())}</p>
          <span className="text-sm text-muted-foreground">
            {period === "day" && "24 jam terakhir"}
            {period === "week" && "7 hari terakhir"}
            {period === "month" && "30 hari terakhir"}
            {period === "year" && "12 bulan terakhir"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey={getXAxisKey()} 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value;
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatIDR(value), 'Pendapatan']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Pendapatan"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}