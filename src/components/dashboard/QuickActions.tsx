import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  FileText, 
  TrendingUp,
  Package,
  Clock,
  UserPlus,
  Calculator,
  CalendarCheck
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  icon: any;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface QuickActionsProps {
  role: string;
  actions?: QuickAction[];
}

export default function QuickActions({ role, actions }: QuickActionsProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const defaultActions: Record<string, QuickAction[]> = {
    waiter: [
      { icon: ShoppingCart, label: t("Tambah Pesanan", "Add Order"), onClick: () => {}, variant: "default" },
      { icon: CalendarCheck, label: t("Booking", "Bookings"), onClick: () => navigate("/bookings"), variant: "default" },
      { icon: Clock, label: t("Ruangan Aktif", "Active Rooms"), onClick: () => {}, variant: "outline" },
      { icon: FileText, label: t("Riwayat", "History"), onClick: () => {}, variant: "outline" },
    ],
    cashier: [
      { icon: Plus, label: t("Mulai Sesi", "Start Session"), onClick: () => {}, variant: "default" },
      { icon: CalendarCheck, label: t("Booking", "Bookings"), onClick: () => navigate("/bookings"), variant: "default" },
      { icon: DollarSign, label: t("Bayar", "Payment"), onClick: () => {}, variant: "outline" },
      { icon: ShoppingCart, label: t("Pesanan", "Orders"), onClick: () => {}, variant: "outline" },
    ],
    manager: [
      { icon: UserPlus, label: t("Tambah Karyawan", "Add Employee"), onClick: () => {}, variant: "default" },
      { icon: CalendarCheck, label: t("Booking", "Bookings"), onClick: () => navigate("/bookings"), variant: "default" },
      { icon: Package, label: t("Kelola Stok", "Manage Stock"), onClick: () => {}, variant: "outline" },
      { icon: TrendingUp, label: t("Analitik", "Analytics"), onClick: () => {}, variant: "outline" },
    ],
    owner: [
      { icon: TrendingUp, label: t("Analitik", "Analytics"), onClick: () => {}, variant: "default" },
      { icon: CalendarCheck, label: t("Booking", "Bookings"), onClick: () => navigate("/bookings"), variant: "default" },
      { icon: DollarSign, label: t("Keuangan", "Finance"), onClick: () => {}, variant: "outline" },
      { icon: Users, label: t("Manajemen Tim", "Team Management"), onClick: () => {}, variant: "outline" },
    ],
    accountant: [
      { icon: Calculator, label: t("Buat Laporan", "Create Report"), onClick: () => {}, variant: "default" },
      { icon: CalendarCheck, label: t("Booking", "Bookings"), onClick: () => navigate("/bookings"), variant: "default" },
      { icon: DollarSign, label: t("Transaksi", "Transactions"), onClick: () => {}, variant: "outline" },
      { icon: TrendingUp, label: t("Pengeluaran", "Expenses"), onClick: () => {}, variant: "outline" },
    ],
  };

  const displayActions = actions || defaultActions[role] || [];

  return (
    <Card className="p-6 glass border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-lg">{t("Aksi Cepat", "Quick Actions")}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {displayActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            className="h-auto py-4 flex flex-col gap-2 transition-smooth hover:scale-105"
            onClick={action.onClick}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
