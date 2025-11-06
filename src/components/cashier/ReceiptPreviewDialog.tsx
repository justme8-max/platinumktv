import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Printer, Share2 } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ReceiptData {
  roomName: string;
  roomNumber: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: ReceiptItem[];
  roomCost: number;
  durationHours: number;
  subtotal: number;
  serviceCharge: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptData | null;
}

export default function ReceiptPreviewDialog({
  open,
  onOpenChange,
  receiptData,
}: ReceiptPreviewDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);

  if (!receiptData) return null;

  const printThermal = async () => {
    setPrinting(true);
    try {
      // Check if Web Bluetooth is supported
      if (!('bluetooth' in navigator)) {
        toast.error("Bluetooth tidak didukung di browser ini");
        return;
      }

      // Request Bluetooth device
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect");

      // Create ESC/POS commands for thermal printer
      const commands = generateESCPOSCommands(receiptData);
      
      // Send to printer via Bluetooth
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      await characteristic.writeValue(commands);

      toast.success("Receipt printed successfully!");
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast.error("Printer tidak ditemukan. Pastikan printer Bluetooth aktif.");
      } else {
        toast.error(`Print failed: ${error.message}`);
      }
    } finally {
      setPrinting(false);
    }
  };

  const generateESCPOSCommands = (data: ReceiptData): Uint8Array => {
    const encoder = new TextEncoder();
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@';
    
    // Center align
    commands += ESC + 'a' + '1';
    
    // Header - Bold and larger
    commands += ESC + 'E' + '1'; // Bold ON
    commands += GS + '!' + '\x11'; // Double height/width
    commands += 'PLATINUM HIGH KTV\n';
    commands += GS + '!' + '\x00'; // Normal size
    commands += ESC + 'E' + '0'; // Bold OFF
    
    commands += '\n';
    commands += '================================\n';
    
    // Left align for receipt details
    commands += ESC + 'a' + '0';
    
    commands += `Receipt: ${data.receiptNumber}\n`;
    commands += `Date: ${data.date}\n`;
    commands += `Cashier: ${data.cashier}\n`;
    commands += `Room: ${data.roomName} (${data.roomNumber})\n`;
    commands += '================================\n';
    
    // Room rental
    commands += `Room ${data.durationHours}h @ ${formatIDR(data.roomCost / data.durationHours)}\n`;
    commands += `${' '.repeat(20)}${formatIDR(data.roomCost)}\n`;
    
    // Items
    if (data.items.length > 0) {
      commands += '--------------------------------\n';
      data.items.forEach(item => {
        commands += `${item.name}\n`;
        commands += `${item.quantity} x ${formatIDR(item.unit_price)}`;
        commands += `${' '.repeat(Math.max(0, 32 - item.quantity.toString().length - formatIDR(item.subtotal).length))}`;
        commands += `${formatIDR(item.subtotal)}\n`;
      });
    }
    
    commands += '================================\n';
    
    // Totals
    commands += `Subtotal:${' '.repeat(16)}${formatIDR(data.subtotal)}\n`;
    
    if (data.serviceCharge > 0) {
      commands += `Service:${' '.repeat(17)}${formatIDR(data.serviceCharge)}\n`;
    }
    
    commands += `PPN 11%:${' '.repeat(17)}${formatIDR(data.taxAmount)}\n`;
    commands += '================================\n';
    
    // Grand total - Bold
    commands += ESC + 'E' + '1';
    commands += GS + '!' + '\x11';
    commands += `TOTAL:${' '.repeat(18)}${formatIDR(data.totalAmount)}\n`;
    commands += GS + '!' + '\x00';
    commands += ESC + 'E' + '0';
    
    commands += '================================\n';
    commands += `Payment: ${data.paymentMethod.toUpperCase()}\n`;
    commands += '\n';
    
    // Footer - Center align
    commands += ESC + 'a' + '1';
    commands += 'Terima kasih atas kunjungan Anda\n';
    commands += 'Thank you for visiting\n';
    commands += '\n';
    
    // Cut paper
    commands += GS + 'V' + '\x00';
    
    return encoder.encode(commands);
  };

  const handleWebPrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (receiptRef.current) {
      try {
        // Create a canvas from the receipt content (requires html2canvas library)
        // For now, just share text
        const text = `Receipt ${receiptData.receiptNumber}\n` +
                    `Room: ${receiptData.roomName}\n` +
                    `Total: ${formatIDR(receiptData.totalAmount)}`;
        
        if (navigator.share) {
          await navigator.share({
            title: 'Receipt',
            text: text,
          });
        } else {
          await navigator.clipboard.writeText(text);
          toast.success("Receipt copied to clipboard!");
        }
      } catch (error) {
        toast.error("Failed to share receipt");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt Preview
          </DialogTitle>
          <DialogDescription>
            Preview sebelum print
          </DialogDescription>
        </DialogHeader>

        <div ref={receiptRef} className="p-4 bg-white text-black font-mono text-sm print:p-0">
          <div className="text-center mb-4">
            <div className="text-xl font-bold">PLATINUM HIGH KTV</div>
            <div className="text-xs mt-1">Receipt</div>
          </div>

          <Separator className="my-2 border-dashed border-black" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receipt:</span>
              <span>{receiptData.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{receiptData.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{receiptData.cashier}</span>
            </div>
            <div className="flex justify-between">
              <span>Room:</span>
              <span>{receiptData.roomName}</span>
            </div>
          </div>

          <Separator className="my-2 border-dashed border-black" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Room ({receiptData.durationHours}h)</span>
              <span>{formatIDR(receiptData.roomCost)}</span>
            </div>

            {receiptData.items.map((item, index) => (
              <div key={index}>
                <div>{item.name}</div>
                <div className="flex justify-between pl-2">
                  <span>{item.quantity} x {formatIDR(item.unit_price)}</span>
                  <span>{formatIDR(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2 border-dashed border-black" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatIDR(receiptData.subtotal)}</span>
            </div>
            {receiptData.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service:</span>
                <span>{formatIDR(receiptData.serviceCharge)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>PPN 11%:</span>
              <span>{formatIDR(receiptData.taxAmount)}</span>
            </div>
          </div>

          <Separator className="my-2 border-dashed border-black" />

          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>{formatIDR(receiptData.totalAmount)}</span>
          </div>

          <Separator className="my-2 border-dashed border-black" />

          <div className="text-xs">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span>{receiptData.paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div className="text-center mt-4 text-xs">
            <div>Terima kasih atas kunjungan Anda</div>
            <div>Thank you for visiting</div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleWebPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Web Print
            </Button>
            <Button size="sm" onClick={printThermal} disabled={printing}>
              <Printer className="h-4 w-4 mr-2" />
              {printing ? "Printing..." : "Thermal Print"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
