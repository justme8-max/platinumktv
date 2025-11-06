import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: any;
}

export default function BookingDialog({
  open,
  onOpenChange,
  booking,
}: BookingDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    room_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    booking_date: new Date(),
    start_time: "",
    end_time: "",
    deposit_amount: "",
    status: "pending" as const,
    notes: "",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (booking) {
      setFormData({
        room_id: booking.room_id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        customer_email: booking.customer_email || "",
        booking_date: new Date(booking.booking_date),
        start_time: booking.start_time,
        end_time: booking.end_time,
        deposit_amount: booking.deposit_amount?.toString() || "",
        status: booking.status,
        notes: booking.notes || "",
      });
    } else {
      setFormData({
        room_id: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        booking_date: new Date(),
        start_time: "",
        end_time: "",
        deposit_amount: "",
        status: "pending",
        notes: "",
      });
    }
  }, [booking, open]);

  const loadRooms = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number");
    if (data) setRooms(data);
  };

  const calculateTotal = () => {
    if (!formData.room_id || !formData.start_time || !formData.end_time) return 0;
    
    const room = rooms.find(r => r.id === formData.room_id);
    if (!room) return 0;

    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return hours * parseFloat(room.hourly_rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate duration and total
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const duration_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const total_amount = calculateTotal();

      // Check availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .rpc('check_room_availability', {
          p_room_id: formData.room_id,
          p_booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
          p_start_time: formData.start_time,
          p_end_time: formData.end_time,
          p_exclude_booking_id: booking?.id || null
        });

      if (availabilityError) throw availabilityError;

      if (!availabilityData) {
        toast.error(t("bookings.roomNotAvailable"));
        setLoading(false);
        return;
      }

      const bookingData = {
        room_id: formData.room_id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_hours,
        total_amount,
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (booking) {
        const { error } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", booking.id);

        if (error) throw error;
        toast.success(t("bookings.updateSuccess"));
      } else {
        const { error } = await supabase
          .from("bookings")
          .insert(bookingData);

        if (error) throw error;
        toast.success(t("bookings.createSuccess"));
      }

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking ? t("bookings.editBooking") : t("bookings.addBooking")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.room")}</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, room_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("bookings.selectRoom")} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_name} ({room.room_number}) - {formatIDR(room.hourly_rate)}/jam
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("bookings.statusPending")}</SelectItem>
                  <SelectItem value="confirmed">{t("bookings.statusConfirmed")}</SelectItem>
                  <SelectItem value="cancelled">{t("bookings.statusCancelled")}</SelectItem>
                  <SelectItem value="completed">{t("bookings.statusCompleted")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.customerName")}</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.customerPhone")}</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData({ ...formData, customer_phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.customerEmail")}</Label>
            <Input
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                setFormData({ ...formData, customer_email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.bookingDate")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.booking_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.booking_date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.booking_date}
                  onSelect={(date) =>
                    date && setFormData({ ...formData, booking_date: date })
                  }
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.startTime")}</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.endTime")}</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.depositAmount")}</Label>
            <Input
              type="number"
              value={formData.deposit_amount}
              onChange={(e) =>
                setFormData({ ...formData, deposit_amount: e.target.value })
              }
              placeholder="0"
            />
          </div>

          {formData.room_id && formData.start_time && formData.end_time && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t("bookings.estimatedTotal")}</p>
              <p className="text-2xl font-bold">{formatIDR(calculateTotal())}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("bookings.notes")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {booking ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
