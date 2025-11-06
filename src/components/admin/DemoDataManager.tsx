import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DemoDataManager() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasManagementAccess, setHasManagementAccess] = useState(false);

  useEffect(() => {
    checkManagementAccess();
  }, []);

  const checkManagementAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "manager", "cashier"]);

    setHasManagementAccess(data && data.length > 0);
  };

  if (!hasManagementAccess) {
    return null; // Hide for non-management users
  }

  const seedDemoData = async () => {
    setLoading(true);
    try {
      // 1. Create categories
      const { data: categories } = await supabase
        .from("categories")
        .insert([
          { name_id: "Minuman", name_en: "Beverages", type: "product" },
          { name_id: "Makanan", name_en: "Food", type: "product" },
          { name_id: "Paket", name_en: "Packages", type: "product" },
        ])
        .select();

      if (!categories) throw new Error("Failed to create categories");

      // 2. Create rooms (11 total, 4 in maintenance)
      const roomData = [
        { room_number: "101", room_name: "VIP Room 1", room_type: "vip", capacity: 10, hourly_rate: 500000, status: "available" as const },
        { room_number: "102", room_name: "VIP Room 2", room_type: "vip", capacity: 10, hourly_rate: 500000, status: "available" as const },
        { room_number: "201", room_name: "Regular Room 1", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "occupied" as const, current_session_start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { room_number: "202", room_name: "Regular Room 2", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "available" as const },
        { room_number: "203", room_name: "Regular Room 3", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "maintenance" as const },
        { room_number: "301", room_name: "Suite Room 1", room_type: "suite", capacity: 15, hourly_rate: 750000, status: "available" as const },
        { room_number: "302", room_name: "Suite Room 2", room_type: "suite", capacity: 15, hourly_rate: 750000, status: "maintenance" as const },
        { room_number: "401", room_name: "Party Room 1", room_type: "party", capacity: 20, hourly_rate: 1000000, status: "available" as const },
        { room_number: "402", room_name: "Party Room 2", room_type: "party", capacity: 20, hourly_rate: 1000000, status: "maintenance" as const },
        { room_number: "501", room_name: "Standard Room 1", room_type: "standard", capacity: 4, hourly_rate: 150000, status: "available" as const },
        { room_number: "502", room_name: "Standard Room 2", room_type: "standard", capacity: 4, hourly_rate: 150000, status: "maintenance" as const },
      ];

      const { data: rooms } = await supabase
        .from("rooms")
        .insert(roomData)
        .select();

      if (!rooms) throw new Error("Failed to create rooms");

      // 3. Create employees (25 Platinum KTV employees)
      const employees = [
        { name: "RINI KURNIAWATI", division: "MANAGER", phone: "81376769907", employee_id: "RK-11/7-MAN" },
        { name: "RISKA ANDRIANI", division: "ACCOUNTING", phone: "81260296823", employee_id: "RA-12/10-ACC" },
        { name: "JEFRY ANDRIZAL", division: "KAPTEN", phone: "81376871996", employee_id: "JA-12/6-KAP" },
        { name: "M.RINALDI SAHPUTRA", division: "KAPTEN", phone: "", employee_id: "MRS-15/6-KAP" },
        { name: "DELIMA OKTAVIANI HUTAJULU", division: "KASIR", phone: "85362910175", employee_id: "DOH-19/5-KAS" },
        { name: "DESI HANDAYANI", division: "KASIR", phone: "85262582338", employee_id: "DH-12/5-KAS" },
        { name: "EDWINSYAH", division: "WAITERS", phone: "85194409449", employee_id: "E-9/7-WAI" },
        { name: "AKHMAD SYAFII LUBIS", division: "WAITERS", phone: "85373642815", employee_id: "ASL-15/7-WAI" },
        { name: "ZULFIKAR", division: "WAITERS", phone: "89636561419", employee_id: "Z-7/7-WAI" },
        { name: "VANNY FEBRIANA", division: "WAITERS", phone: "82163575027", employee_id: "VF-12/7-WAI" },
        { name: "KAI RAHMAT", division: "OB", phone: "83853283373", employee_id: "KR-8/2-OBJ" },
        { name: "SYAHFRIL", division: "OB", phone: "82376603434", employee_id: "S-7/2-OBJ" },
        { name: "MUHAMMAD CHANDRA", division: "OB", phone: "83171612596", employee_id: "MC-13/2-OBJ" },
        { name: "ERIK WIJAYA", division: "DJ", phone: "", employee_id: "EW-9/2-DJJ" },
        { name: "ANDY EFENDY", division: "DJ", phone: "85371373672", employee_id: "AE-9/2-DJJ" },
        { name: "M.ILHAM AZIZI", division: "DJ", phone: "81362214465", employee_id: "MIA-10/2-DJJ" },
        { name: "BARA", division: "DJ", phone: "82164560426", employee_id: "B-4/2-DJJ" },
        { name: "ADE SURYA MUCHTAR", division: "SECURTY", phone: "82160703883", employee_id: "ASM-13/7-SEC" },
        { name: "FAUZI HERIADI", division: "SECURTY", phone: "82286931868", employee_id: "FH-11/7-SEC" },
        { name: "GALIH", division: "SECURTY", phone: "97821136267", employee_id: "G-5/7-SEC" },
        { name: "MUHAMMAD YUDI", division: "SECURTY", phone: "85765037212", employee_id: "MY-11/7-SEC" },
        { name: "M.MUCHTARDI", division: "SOUNDMEN", phone: "83165789177", employee_id: "MM-10/8-SOU" },
        { name: "ISWANTO", division: "SOUNDMEN", phone: "83197681356", employee_id: "I-7/8-SOU" },
        { name: "LUTHFI ROZIQIN", division: "BAR", phone: "81263497433", employee_id: "LR-11/3-BAR" },
        { name: "DEDI HARYONO", division: "BAR", phone: "81265831033", employee_id: "DH-10/3-BAR" },
      ];

      await supabase.from("employees").insert(employees);

      // 4. Create products
      const products = [
        { sku: "BEV001", name_id: "Coca Cola", name_en: "Coca Cola", category_id: categories[0].id, price: 25000, cost: 15000, stock_quantity: 100, min_stock_level: 20 },
        { sku: "BEV002", name_id: "Sprite", name_en: "Sprite", category_id: categories[0].id, price: 25000, cost: 15000, stock_quantity: 100, min_stock_level: 20 },
        { sku: "BEV003", name_id: "Air Mineral", name_en: "Mineral Water", category_id: categories[0].id, price: 15000, cost: 8000, stock_quantity: 150, min_stock_level: 30 },
        { sku: "FOOD001", name_id: "French Fries", name_en: "French Fries", category_id: categories[1].id, price: 35000, cost: 20000, stock_quantity: 50, min_stock_level: 10 },
        { sku: "FOOD002", name_id: "Chicken Wings", name_en: "Chicken Wings", category_id: categories[1].id, price: 45000, cost: 25000, stock_quantity: 50, min_stock_level: 10 },
        { sku: "PKG001", name_id: "Paket Hemat 1", name_en: "Value Package 1", category_id: categories[2].id, price: 150000, cost: 90000, stock_quantity: 30, min_stock_level: 5 },
      ];

      await supabase.from("products").insert(products);

      // 5. Create a booking for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await supabase.from("bookings").insert([
        {
          room_id: rooms[0].id,
          customer_name: "John Doe",
          customer_phone: "08123456789",
          customer_email: "john@example.com",
          booking_date: tomorrow.toISOString().split('T')[0],
          start_time: "18:00:00",
          end_time: "22:00:00",
          duration_hours: 4,
          total_amount: 2000000,
          deposit_amount: 500000,
          status: "confirmed",
          notes: "Birthday party",
        },
      ]);

      // 6. Create some past transactions
      const { data: { user } } = await supabase.auth.getUser();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await supabase.from("transactions").insert([
        {
          room_id: rooms[1].id,
          cashier_id: user?.id,
          transaction_type: "room_rental",
          amount: 500000,
          payment_method: "cash",
          session_start: new Date(yesterday.setHours(14, 0, 0)).toISOString(),
          session_end: new Date(yesterday.setHours(16, 0, 0)).toISOString(),
          duration_hours: 2,
          description: "VIP Room 2 - 2 hours",
          created_at: yesterday.toISOString(),
        },
        {
          room_id: rooms[3].id,
          cashier_id: user?.id,
          transaction_type: "room_rental",
          amount: 750000,
          payment_method: "card",
          session_start: new Date(yesterday.setHours(19, 0, 0)).toISOString(),
          session_end: new Date(yesterday.setHours(22, 0, 0)).toISOString(),
          duration_hours: 3,
          description: "Regular Room 2 - 3 hours",
          created_at: yesterday.toISOString(),
        },
      ]);

      toast.success("Demo data seeded! 11 rooms (4 in maintenance) & 25 employees created");
      setOpen(false);
    } catch (error: any) {
      toast.error(`Failed to seed data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetDemoData = async () => {
    setLoading(true);
    try {
      // Delete in correct order due to foreign keys
      await supabase.from("sales_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("stock_movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("approval_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("purchase_order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("purchase_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("recurring_bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      toast.success("All demo data cleared successfully!");
      setOpen(false);
      
      // Reload page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(`Failed to reset data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Demo Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo Data Manager</DialogTitle>
          <DialogDescription>
            Seed or reset demo data for testing purposes
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Seed Demo Data includes:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>11 KTV Rooms (7 available, 4 in maintenance)</li>
              <li>25 Platinum KTV Employees (all divisions)</li>
              <li>3 Product Categories</li>
              <li>6 Products (drinks, food, packages)</li>
              <li>1 Upcoming Booking</li>
              <li>2 Past Transactions</li>
              <li>1 Active Session (Room 201)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={resetDemoData}
            variant="destructive"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Reset All Data
          </Button>
          <Button
            onClick={seedDemoData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed Demo Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
