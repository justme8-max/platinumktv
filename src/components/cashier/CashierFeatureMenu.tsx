import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Receipt, 
  Split, 
  Percent, 
  Calculator,
  DollarSign,
  FileText,
  Settings,
  Clock,
  Printer,
  CreditCard
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CashierFeatureMenuProps {
  roomId: string;
  roomName: string;
  onAddItems: () => void;
  onProcessPayment: () => void;
  onRequestDiscount: () => void;
  onViewReceipt: () => void;
}

export default function CashierFeatureMenu({
  roomId,
  roomName,
  onAddItems,
  onProcessPayment,
  onRequestDiscount,
  onViewReceipt,
}: CashierFeatureMenuProps) {
  
  const features = [
    {
      title: "Tambah Item",
      description: "Tambahkan makanan/minuman ke pesanan",
      icon: DollarSign,
      color: "text-green-600",
      action: onAddItems,
    },
    {
      title: "Proses Pembayaran",
      description: "Bayar dan tutup sesi ruangan",
      icon: CreditCard,
      color: "text-blue-600",
      action: onProcessPayment,
    },
    {
      title: "Minta Diskon",
      description: "Request approval diskon atau potongan",
      icon: Percent,
      color: "text-purple-600",
      action: onRequestDiscount,
    },
    {
      title: "Lihat Nota",
      description: "Cetak nota sementara (preview)",
      icon: Receipt,
      color: "text-orange-600",
      action: onViewReceipt,
    },
    {
      title: "Split Bill",
      description: "Bagi tagihan untuk beberapa pembayaran",
      icon: Split,
      color: "text-pink-600",
      action: () => {},
      disabled: true,
    },
    {
      title: "Extend Waktu",
      description: "Perpanjang durasi sesi ruangan",
      icon: Clock,
      color: "text-cyan-600",
      action: () => {},
      disabled: true,
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Menu Fitur
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu Kasir</SheetTitle>
          <SheetDescription>
            Fitur untuk {roomName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  feature.disabled ? 'opacity-50' : 'hover:border-primary'
                }`}
                onClick={!feature.disabled ? feature.action : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                      {feature.disabled && (
                        <span className="text-xs text-orange-500 mt-1 inline-block">
                          Segera hadir
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                PPN Regional Indonesia
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                PPN 11% sudah termasuk otomatis dalam setiap transaksi sesuai peraturan perpajakan Indonesia.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
          <div className="flex items-start gap-2">
            <Calculator className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Service Charge (Opsional)
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Service charge dapat diaktifkan dari pengaturan pajak dan akan ditambahkan sebelum PPN.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
