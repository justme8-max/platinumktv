import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BookingListProps {
  onEditBooking: (booking: any) => void;
}

export default function BookingList({ onEditBooking }: BookingListProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          rooms (room_name, room_number)
        `)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t("bookings.confirmDelete"))) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success(t("bookings.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const labels: Record<string, string> = {
      pending: t("bookings.statusPending"),
      confirmed: t("bookings.statusConfirmed"),
      cancelled: t("bookings.statusCancelled"),
      completed: t("bookings.statusCompleted"),
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">{t("common.loading")}...</div>;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("bookings.noBookings")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("bookings.bookingDate")}</TableHead>
            <TableHead>{t("bookings.time")}</TableHead>
            <TableHead>{t("bookings.room")}</TableHead>
            <TableHead>{t("bookings.customer")}</TableHead>
            <TableHead>{t("bookings.status")}</TableHead>
            <TableHead className="text-right">{t("bookings.total")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                {format(new Date(booking.booking_date), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                {booking.start_time} - {booking.end_time}
              </TableCell>
              <TableCell>
                {booking.rooms?.room_name} ({booking.rooms?.room_number})
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.customer_phone}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(booking.status)}</TableCell>
              <TableCell className="text-right">
                {formatIDR(booking.total_amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditBooking(booking)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(booking.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
