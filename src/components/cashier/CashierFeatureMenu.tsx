import { useState } from "react";
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
import SplitBillDialog from "./SplitBillDialog";
import ReceiptPreviewDialog from "./ReceiptPreviewDialog";

interface CashierFeatureMenuProps {
  roomId: string;
  roomName: string;
  totalAmount: number;
  onAddItems: () => void;
  onProcessPayment: () => void;
  onRequestDiscount: () => void;
  onExtendTime: () => void;
}

export default function CashierFeatureMenu({
  roomId,
  roomName,
  totalAmount,
  onAddItems,
  onProcessPayment,
  onRequestDiscount,
  onExtendTime,
}: CashierFeatureMenuProps) {
  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const dummyReceiptData = {
    roomName,
    roomNumber: "101",
    receiptNumber: `RCP-${Date.now()}`,
    date: new Date().toLocaleString(),
    cashier: "Kasir Demo",
    items: [],
    roomCost: totalAmount * 0.7,
    durationHours: 2,
    subtotal: totalAmount * 0.9,
    serviceCharge: 0,
    taxAmount: totalAmount * 0.1,
    totalAmount,
    paymentMethod: "cash",
  };

  const handleSplitBill = (splits: number[]) => {
    console.log("Split bill:", splits);
    // Implementation for processing split bill
  };
  
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
      action: () => setReceiptOpen(true),
    },
    {
      title: "Split Bill",
      description: "Bagi tagihan untuk beberapa pembayaran",
      icon: Split,
      color: "text-pink-600",
      action: () => setSplitBillOpen(true),
    },
    {
      title: "Extend Waktu",
      description: "Perpanjang durasi sesi ruangan",
      icon: Clock,
      color: "text-cyan-600",
      action: onExtendTime,
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
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                onClick={feature.action}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <SplitBillDialog
          open={splitBillOpen}
          onOpenChange={setSplitBillOpen}
          totalAmount={totalAmount}
          onSplit={handleSplitBill}
        />

        <ReceiptPreviewDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          receiptData={dummyReceiptData}
        />

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
