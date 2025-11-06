import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { Calendar, Clock, User, DollarSign, History } from "lucide-react";
import { format } from "date-fns";

interface RoomBookingHistoryProps {
  roomId: string;
  roomName: string;
}

export default function RoomBookingHistory({ roomId, roomName }: RoomBookingHistoryProps) {
  const { t } = useLanguage();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["room-bookings", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("room_id", roomId)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {t(`bookings.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "border-l-yellow-500",
      confirmed: "border-l-green-500",
      cancelled: "border-l-red-500",
      completed: "border-l-blue-500",
    };
    return colors[status] || "border-l-gray-500";
  };

  const now = new Date();
  const upcomingBookings = bookings?.filter(b => {
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate > now && (b.status === 'confirmed' || b.status === 'pending');
  }) || [];

  const pastBookings = bookings?.filter(b => {
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate <= now || b.status === 'completed' || b.status === 'cancelled';
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('booking_history.title')} - {roomName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('common.loading')}...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('booking_history.title')} - {roomName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('booking_history.total_bookings')}: {bookings?.length || 0}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('booking_history.upcoming')} ({upcomingBookings.length})
              </h3>
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Card 
                    key={booking.id} 
                    className={`border-l-4 ${getStatusColor(booking.status)}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {format(new Date(booking.booking_date), "EEE, dd MMM yyyy")}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                            <span>({booking.duration_hours}h)</span>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{booking.customer_name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{booking.customer_phone}</span>
                        </div>

                        {booking.customer_email && (
                          <p className="text-muted-foreground ml-5">{booking.customer_email}</p>
                        )}

                        {booking.notes && (
                          <p className="text-muted-foreground italic ml-5 mt-2">
                            "{booking.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 mt-2 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-semibold">{formatIDR(booking.total_amount)}</span>
                          </div>
                          {booking.deposit_amount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {t('bookings.deposit')}: {formatIDR(booking.deposit_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('booking_history.past')} ({pastBookings.length})
              </h3>
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <Card 
                    key={booking.id} 
                    className={`border-l-4 ${getStatusColor(booking.status)} opacity-75`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {format(new Date(booking.booking_date), "EEE, dd MMM yyyy")}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                            <span>({booking.duration_hours}h)</span>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{booking.customer_name}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-semibold">{formatIDR(booking.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(!bookings || bookings.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('booking_history.no_bookings')}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
