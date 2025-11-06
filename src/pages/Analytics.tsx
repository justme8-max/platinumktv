import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useState } from "react";
import { TrendingUp, DollarSign, Calendar, Clock, Users } from "lucide-react";

export default function Analytics() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("7");

  const { data: role } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data?.role || "cashier";
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateString = startDate.toISOString().split('T')[0];

      // Fetch bookings data
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, rooms(room_name, hourly_rate)")
        .gte("booking_date", startDateString);

      // Fetch transactions data
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      // Calculate room utilization
      const { data: rooms } = await supabase.from("rooms").select("*");

      const totalRooms = rooms?.length || 0;
      const totalHours = daysAgo * 24 * totalRooms;
      const bookedHours = bookings?.reduce((sum, b) => sum + (b.duration_hours || 0), 0) || 0;
      const utilization = totalHours > 0 ? (bookedHours / totalHours) * 100 : 0;

      // Popular time slots
      const timeSlots: Record<string, number> = {};
      bookings?.forEach(b => {
        const hour = b.start_time.split(':')[0];
        timeSlots[`${hour}:00`] = (timeSlots[`${hour}:00`] || 0) + 1;
      });

      // Revenue by room
      const revenueByRoom: Record<string, number> = {};
      bookings?.forEach(b => {
        const roomName = b.rooms?.room_name || "Unknown";
        revenueByRoom[roomName] = (revenueByRoom[roomName] || 0) + (b.total_amount || 0);
      });

      // Daily revenue trend
      const dailyRevenue: Record<string, number> = {};
      bookings?.forEach(b => {
        dailyRevenue[b.booking_date] = (dailyRevenue[b.booking_date] || 0) + (b.total_amount || 0);
      });

      // Booking status distribution
      const statusCounts: Record<string, number> = {};
      bookings?.forEach(b => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });

      return {
        utilization,
        totalBookings: bookings?.length || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        avgBookingValue: bookings?.length ? 
          (bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / bookings.length) : 0,
        timeSlots: Object.entries(timeSlots)
          .map(([time, count]) => ({ time, bookings: count }))
          .sort((a, b) => a.time.localeCompare(b.time)),
        roomRevenue: Object.entries(revenueByRoom)
          .map(([room, revenue]) => ({ room, revenue }))
          .sort((a, b) => b.revenue - a.revenue),
        dailyRevenue: Object.entries(dailyRevenue)
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        statusDistribution: Object.entries(statusCounts)
          .map(([status, count]) => ({ status, count })),
      };
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <DashboardLayout role={role || "cashier"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
            <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("analytics.last7days")}</SelectItem>
              <SelectItem value="30">{t("analytics.last30days")}</SelectItem>
              <SelectItem value="90">{t("analytics.last90days")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.utilization")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.utilization.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{t("analytics.room_utilization")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.total_bookings")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalBookings}</div>
              <p className="text-xs text-muted-foreground">{t("analytics.bookings_count")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.total_revenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatIDR(analytics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">{t("analytics.revenue_period")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("analytics.avg_booking")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatIDR(analytics?.avgBookingValue || 0)}</div>
              <p className="text-xs text-muted-foreground">{t("analytics.per_booking")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t("analytics.popular_times")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.timeSlots}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("analytics.revenue_by_room")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.roomRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="room" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatIDR(value as number)} />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("analytics.revenue_trend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatIDR(value as number)} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("analytics.status_distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.status}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics?.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
