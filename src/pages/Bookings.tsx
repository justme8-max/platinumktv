import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, List } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import BookingDialog from "@/components/booking/BookingDialog";
import BookingList from "@/components/booking/BookingList";
import BookingCalendar from "@/components/booking/BookingCalendar";

export default function Bookings() {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Get user role
  const { data: userRoles } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return data;
    },
  });

  const role = userRoles?.role || "cashier";

  const handleAddBooking = () => {
    setSelectedBooking(null);
    setDialogOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("bookings.title")}</h1>
            <p className="text-muted-foreground">{t("bookings.subtitle")}</p>
          </div>
          <Button onClick={handleAddBooking}>
            <Plus className="h-4 w-4 mr-2" />
            {t("bookings.addBooking")}
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="bg-card">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t("bookings.calendar")}
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              {t("bookings.list")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <BookingCalendar onEditBooking={handleEditBooking} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <BookingList onEditBooking={handleEditBooking} />
          </TabsContent>
        </Tabs>

        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          booking={selectedBooking}
        />
      </div>
    </DashboardLayout>
  );
}
