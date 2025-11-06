import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AutoSeedData() {
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    checkAndSeed();
  }, []);

  const checkAndSeed = async () => {
    try {
      // Check if already seeded
      const seeded = localStorage.getItem('data_seeded');
      if (seeded) return;

      // Check if user has management access
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "manager"]);

      // Only owner/manager can auto-seed due to RLS policies
      if (!roles || roles.length === 0) {
        localStorage.setItem('data_seeded', 'true');
        return;
      }

      // Check if rooms exist
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("id")
        .limit(1);

      if (error) throw error;

      // If rooms exist, mark as seeded
      if (rooms && rooms.length > 0) {
        localStorage.setItem('data_seeded', 'true');
        return;
      }

      // Auto-seed data
      setIsSeeding(true);
      await seedData();
      localStorage.setItem('data_seeded', 'true');
      toast.success("✅ Database auto-seeded! 11 rooms & 25 employees ready");
      
      // Reload after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error("Auto-seed error:", error);
      localStorage.setItem('data_seeded', 'true');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedData = async () => {
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

    // 2. Create rooms
    const roomData = [
      { room_number: "101", room_name: "VIP Room 1", room_type: "vip", capacity: 10, hourly_rate: 500000, status: "available" as const },
      { room_number: "102", room_name: "VIP Room 2", room_type: "vip", capacity: 10, hourly_rate: 500000, status: "available" as const },
      { room_number: "201", room_name: "Regular Room 1", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "available" as const },
      { room_number: "202", room_name: "Regular Room 2", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "available" as const },
      { room_number: "203", room_name: "Regular Room 3", room_type: "regular", capacity: 6, hourly_rate: 250000, status: "maintenance" as const },
      { room_number: "301", room_name: "Suite Room 1", room_type: "suite", capacity: 15, hourly_rate: 750000, status: "available" as const },
      { room_number: "302", room_name: "Suite Room 2", room_type: "suite", capacity: 15, hourly_rate: 750000, status: "maintenance" as const },
      { room_number: "401", room_name: "Party Room 1", room_type: "party", capacity: 20, hourly_rate: 1000000, status: "available" as const },
      { room_number: "402", room_name: "Party Room 2", room_type: "party", capacity: 20, hourly_rate: 1000000, status: "maintenance" as const },
      { room_number: "501", room_name: "Standard Room 1", room_type: "standard", capacity: 4, hourly_rate: 150000, status: "available" as const },
      { room_number: "502", room_name: "Standard Room 2", room_type: "standard", capacity: 4, hourly_rate: 150000, status: "maintenance" as const },
    ];

    const { data: rooms } = await supabase.from("rooms").insert(roomData).select();
    if (!rooms) throw new Error("Failed to create rooms");

    // 3. Create employees
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
  };

  if (isSeeding) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-xl">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Setting up database...</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  return null;
}
