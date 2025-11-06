import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, RefreshCw, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import RecurringBookingDialog from "@/components/booking/RecurringBookingDialog";

export default function RecurringBookings() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);

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

  const { data: recurringBookings, refetch } = useQuery({
    queryKey: ["recurring-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bookings")
        .select(`
          *,
          rooms (room_name, room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t("recurring_booking.confirm_delete"))) return;

    const { error } = await supabase
      .from("recurring_bookings")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(t("recurring_booking.delete_error"));
    } else {
      toast.success(t("recurring_booking.deleted"));
      refetch();
    }
  };

  const handleEdit = (recurring: any) => {
    setSelectedRecurring(recurring);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecurring(null);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout role={role || "cashier"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <RefreshCw className="h-8 w-8" />
              {t("recurring_booking.title")}
            </h1>
            <p className="text-muted-foreground">{t("recurring_booking.subtitle")}</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("recurring_booking.add")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringBookings?.map((recurring) => {
            const roomInfo = Array.isArray(recurring.rooms) ? recurring.rooms[0] : recurring.rooms;
            
            return (
              <Card key={recurring.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{roomInfo?.room_name}</h3>
                      <p className="text-sm text-muted-foreground">{roomInfo?.room_number}</p>
                    </div>
                    <Badge variant={recurring.is_active ? "default" : "secondary"}>
                      {recurring.is_active ? t("recurring_booking.active") : t("recurring_booking.inactive")}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>{t("recurring_booking.customer")}:</strong> {recurring.customer_name}</p>
                    <p><strong>{t("recurring_booking.frequency")}:</strong> {t(`recurring_booking.${recurring.frequency}`)}</p>
                    <p><strong>{t("recurring_booking.time")}:</strong> {recurring.start_time} - {recurring.end_time}</p>
                    {recurring.frequency === "weekly" && (
                      <p><strong>{t("recurring_booking.day")}:</strong> {
                        [t("recurring_booking.sunday"), t("recurring_booking.monday"), t("recurring_booking.tuesday"), 
                         t("recurring_booking.wednesday"), t("recurring_booking.thursday"), t("recurring_booking.friday"), 
                         t("recurring_booking.saturday")][recurring.day_of_week]
                      }</p>
                    )}
                    {recurring.frequency === "monthly" && (
                      <p><strong>{t("recurring_booking.day")}:</strong> {recurring.day_of_month}</p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(recurring)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      {t("common.edit")}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(recurring.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(!recurringBookings || recurringBookings.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">{t("recurring_booking.no_bookings")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <RecurringBookingDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedRecurring(null);
            refetch();
          }
        }}
        recurring={selectedRecurring}
      />
    </DashboardLayout>
  );
}
