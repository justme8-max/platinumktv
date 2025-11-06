import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { Clock, User, MapPin } from "lucide-react";

interface BookingCalendarProps {
  onEditBooking: (booking: any) => void;
}

export default function BookingCalendar({ onEditBooking }: BookingCalendarProps) {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: bookings } = useQuery({
    queryKey: ["bookings", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          rooms (room_name, room_number, room_type)
        `)
        .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
        .order("start_time");

      if (error) throw error;
      return data;
    },
  });

  const { data: allBookings } = useQuery({
    queryKey: ["bookings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, status")
        .gte("booking_date", format(new Date(), "yyyy-MM-dd"));

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-green-500",
      cancelled: "bg-red-500",
      completed: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const labels: Record<string, string> = {
      pending: t.bookings.statusPending,
      confirmed: t.bookings.statusConfirmed,
      cancelled: t.bookings.statusCancelled,
      completed: t.bookings.statusCompleted,
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Get dates with bookings for calendar highlighting
  const bookedDates = allBookings
    ?.filter(b => b.status !== 'cancelled')
    .map(b => new Date(b.booking_date)) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>{t.bookings.selectDate}</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="pointer-events-auto rounded-md border"
            modifiers={{
              booked: bookedDates,
            }}
            modifiersStyles={{
              booked: {
                fontWeight: 'bold',
                textDecoration: 'underline',
              },
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {t.bookings.bookingsFor} {format(selectedDate, "dd MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.bookings.noBookingsForDate}
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onEditBooking(booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        />
                        <h3 className="font-semibold text-lg">
                          {booking.rooms?.room_name}
                        </h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {booking.start_time} - {booking.end_time} (
                          {booking.duration_hours}h)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>
                          {booking.customer_name} • {booking.customer_phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {booking.rooms?.room_type} • {booking.rooms?.room_number}
                        </span>
                      </div>

                      {booking.notes && (
                        <p className="text-muted-foreground italic mt-2">
                          {booking.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t mt-3">
                        <div>
                          {booking.deposit_amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {t.bookings.deposit}: {formatIDR(booking.deposit_amount)}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold">
                          {formatIDR(booking.total_amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
