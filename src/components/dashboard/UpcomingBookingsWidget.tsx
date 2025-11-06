import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  rooms: {
    room_name: string;
    room_number: string;
  };
}

export default function UpcomingBookingsWidget() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const { t } = useLanguage();

  useEffect(() => {
    loadUpcomingBookings();

    // Setup realtime subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => loadUpcomingBookings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Update countdowns every second
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      
      bookings.forEach(booking => {
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
        const now = new Date();
        const diff = bookingDateTime.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          if (days > 0) {
            newCountdowns[booking.id] = `${days}d ${hours}h`;
          } else if (hours > 0) {
            newCountdowns[booking.id] = `${hours}h ${minutes}m`;
          } else if (minutes > 0) {
            newCountdowns[booking.id] = `${minutes}m ${seconds}s`;
          } else {
            newCountdowns[booking.id] = `${seconds}s`;
          }
        } else {
          newCountdowns[booking.id] = "Started";
        }
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [bookings]);

  const loadUpcomingBookings = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (
          room_name,
          room_number
        )
      `)
      .gte("booking_date", today)
      .in("status", ["pending", "confirmed"])
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5);

    if (data) {
      setBookings(data as any);
    }
  };

  const getCountdownColor = (countdown: string) => {
    if (countdown === "Started") return "text-green-600 font-bold";
    if (countdown.includes("m") && !countdown.includes("h") && !countdown.includes("d")) {
      return "text-orange-600 font-bold animate-pulse";
    }
    if (countdown.includes("h") && !countdown.includes("d")) {
      return "text-yellow-600 font-semibold";
    }
    return "text-blue-600";
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No upcoming bookings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                  {booking.status}
                </Badge>
                <span className="font-semibold">
                  {booking.rooms.room_name}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(booking.booking_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {booking.customer_name}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {booking.customer_phone}
                </div>
              </div>

              <div className="text-sm font-semibold">
                {formatIDR(booking.total_amount)}
              </div>
            </div>

            <div className="ml-4 text-right">
              <div className="text-xs text-muted-foreground mb-1">
                Starts in
              </div>
              <div className={`text-lg font-mono ${getCountdownColor(countdowns[booking.id] || "")}`}>
                {countdowns[booking.id] || "..."}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
