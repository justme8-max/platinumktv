import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Clock, List, MessageSquare } from "lucide-react";

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddOrder?: () => void;
  onExtendTime?: () => void;
  onViewHistory?: () => void;
  onChat?: () => void;
}

export default function QuickActionsSheet({
  open,
  onOpenChange,
  onAddOrder,
  onExtendTime,
  onViewHistory,
  onChat,
}: QuickActionsSheetProps) {
  const { t } = useLanguage();

  const actions = [
    {
      icon: Plus,
      label: t("Tambah Pesanan", "Add Order"),
      onClick: onAddOrder,
      variant: "default" as const,
    },
    {
      icon: Clock,
      label: t("Perpanjang Waktu", "Extend Time"),
      onClick: onExtendTime,
      variant: "outline" as const,
    },
    {
      icon: List,
      label: t("Lihat Riwayat", "View History"),
      onClick: onViewHistory,
      variant: "outline" as const,
    },
    {
      icon: MessageSquare,
      label: t("Chat Tim", "Team Chat"),
      onClick: onChat,
      variant: "outline" as const,
    },
  ];

  const handleAction = (action: typeof actions[0]) => {
    action.onClick?.();
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("Aksi Cepat", "Quick Actions")}
      description={t("Pilih aksi yang ingin dilakukan", "Select an action to perform")}
    >
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="h-24 flex flex-col gap-2"
            onClick={() => handleAction(action)}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </BottomSheet>
  );
}
