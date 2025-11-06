import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RecurringBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurring?: any;
}

export default function RecurringBookingDialog({
  open,
  onOpenChange,
  recurring,
}: RecurringBookingDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    room_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    start_time: "",
    end_time: "",
    frequency: "weekly",
    day_of_week: 0,
    day_of_month: 1,
    start_date: new Date(),
    end_date: null as Date | null,
    deposit_amount: 0,
    notes: "",
  });

  useEffect(() => {
    const loadRooms = async () => {
      const { data } = await supabase.from("rooms").select("*").order("room_number");
      if (data) setRooms(data);
    };
    loadRooms();
  }, []);

  useEffect(() => {
    if (recurring) {
      setFormData({
        room_id: recurring.room_id || "",
        customer_name: recurring.customer_name || "",
        customer_phone: recurring.customer_phone || "",
        customer_email: recurring.customer_email || "",
        start_time: recurring.start_time || "",
        end_time: recurring.end_time || "",
        frequency: recurring.frequency || "weekly",
        day_of_week: recurring.day_of_week || 0,
        day_of_month: recurring.day_of_month || 1,
        start_date: recurring.start_date ? new Date(recurring.start_date) : new Date(),
        end_date: recurring.end_date ? new Date(recurring.end_date) : null,
        deposit_amount: recurring.deposit_amount || 0,
        notes: recurring.notes || "",
      });
    }
  }, [recurring]);

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    const [startH, startM] = formData.start_time.split(":").map(Number);
    const [endH, endM] = formData.end_time.split(":").map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const room = rooms.find(r => r.id === formData.room_id);
      if (!room) throw new Error("Room not found");

      const duration = calculateDuration();
      const data: any = {
        ...formData,
        frequency: formData.frequency as "weekly" | "monthly",
        duration_hours: duration,
        hourly_rate: room.hourly_rate,
        start_date: format(formData.start_date, "yyyy-MM-dd"),
        end_date: formData.end_date ? format(formData.end_date, "yyyy-MM-dd") : null,
        created_by: user.id,
      };

      if (recurring) {
        const { error } = await supabase
          .from("recurring_bookings")
          .update(data)
          .eq("id", recurring.id);
        if (error) throw error;
        toast.success(t("recurring_booking.updated"));
      } else {
        const { error } = await supabase
          .from("recurring_bookings")
          .insert([data]);
        if (error) throw error;
        toast.success(t("recurring_booking.created"));
      }

      queryClient.invalidateQueries({ queryKey: ["recurring-bookings"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || t("recurring_booking.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {recurring ? t("recurring_booking.edit_title") : t("recurring_booking.add_title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.room")}</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("bookings.selectRoom")} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_name} - {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("recurring_booking.frequency")}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t("recurring_booking.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("recurring_booking.monthly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.frequency === "weekly" && (
            <div className="space-y-2">
              <Label>{t("recurring_booking.day_of_week")}</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("recurring_booking.sunday")}</SelectItem>
                  <SelectItem value="1">{t("recurring_booking.monday")}</SelectItem>
                  <SelectItem value="2">{t("recurring_booking.tuesday")}</SelectItem>
                  <SelectItem value="3">{t("recurring_booking.wednesday")}</SelectItem>
                  <SelectItem value="4">{t("recurring_booking.thursday")}</SelectItem>
                  <SelectItem value="5">{t("recurring_booking.friday")}</SelectItem>
                  <SelectItem value="6">{t("recurring_booking.saturday")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === "monthly" && (
            <div className="space-y-2">
              <Label>{t("recurring_booking.day_of_month")}</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.day_of_month}
                onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.startTime")}</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.endTime")}</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.customerName")}</Label>
            <Input
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bookings.phone")}</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("bookings.email")}</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("recurring_booking.start_date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t("recurring_booking.end_date")} ({t("recurring_booking.optional")})</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, "PPP") : t("recurring_booking.no_end")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                  />
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setFormData({ ...formData, end_date: null })}
                  >
                    {t("recurring_booking.clear_end")}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.deposit")}</Label>
            <Input
              type="number"
              min="0"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("bookings.notes")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : (recurring ? t("common.update") : t("common.create"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
