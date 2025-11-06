import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Clock, Plus } from "lucide-react";
import { formatIDR } from "@/lib/currency";

interface ExtendTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string | null;
  hourlyRate: number;
  onSuccess: () => void;
}

export default function ExtendTimeDialog({
  open,
  onOpenChange,
  bookingId,
  hourlyRate,
  onSuccess,
}: ExtendTimeDialogProps) {
  const { t } = useLanguage();
  const [extensionHours, setExtensionHours] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (data) {
        setBooking(data);
      }
    };

    if (open && bookingId) {
      fetchBooking();
    }
  }, [open, bookingId]);

  const additionalCost = extensionHours * hourlyRate;
  const newTotal = booking ? booking.total_amount + additionalCost : 0;

  const handleExtend = async () => {
    if (!booking) return;
    
    setLoading(true);
    try {
      // Calculate new end time
      const currentEndDate = new Date(`${booking.booking_date}T${booking.end_time}`);
      currentEndDate.setHours(currentEndDate.getHours() + extensionHours);
      
      const newEndTime = currentEndDate.toTimeString().slice(0, 5);
      const newDuration = booking.duration_hours + extensionHours;
      
      // Check room availability for extended time
      const { data: isAvailable } = await supabase.rpc('check_room_availability', {
        p_room_id: booking.room_id,
        p_booking_date: booking.booking_date,
        p_start_time: booking.end_time,
        p_end_time: newEndTime,
        p_exclude_booking_id: booking.id,
      });

      if (!isAvailable) {
        toast.error(t('extend_time.unavailable'));
        setLoading(false);
        return;
      }

      // Update booking
      const { error } = await supabase
        .from('bookings')
        .update({
          end_time: newEndTime,
          duration_hours: newDuration,
          total_amount: newTotal,
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast.success(t('extend_time.success', { hours: extensionHours }));
      onSuccess();
      onOpenChange(false);
      setExtensionHours(1);
    } catch (error) {
      console.error('Error extending time:', error);
      toast.error(t('extend_time.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('extend_time.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">{t('extend_time.additional_hours')}</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="12"
              value={extensionHours}
              onChange={(e) => setExtensionHours(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('extend_time.hourly_rate')}</span>
              <span className="font-medium">{formatIDR(hourlyRate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('extend_time.additional_cost')}</span>
              <span className="font-medium">{formatIDR(additionalCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">{t('extend_time.current_total')}</span>
              <span className="text-muted-foreground">{formatIDR(booking?.total_amount || 0)}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span>{t('extend_time.new_total')}</span>
              <span className="text-primary">{formatIDR(newTotal)}</span>
            </div>
          </div>

          {booking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {t('extend_time.new_end_time')}: {booking.end_time} → {
                  (() => {
                    const d = new Date(`${booking.booking_date}T${booking.end_time}`);
                    d.setHours(d.getHours() + extensionHours);
                    return d.toTimeString().slice(0, 5);
                  })()
                }
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExtend} disabled={loading}>
            {loading ? t('extend_time.extending') : t('extend_time.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
