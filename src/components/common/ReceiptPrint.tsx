import { forwardRef } from "react";
import { formatIDR } from "@/lib/currency";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  roomName?: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  changeAmount?: number;
}

interface ReceiptPrintProps {
  data: ReceiptData;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black font-mono text-sm max-w-[80mm] mx-auto"
        style={{ width: "302px" }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-xl font-bold mb-1">PLATINUM HIGH KTV</h1>
          <p className="text-xs">Jl. Contoh No. 123, Jakarta</p>
          <p className="text-xs">Telp: (021) 1234-5678</p>
        </div>

        {/* Receipt Info */}
        <div className="mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span>No. Struk:</span>
            <span className="font-bold">{data.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{data.date}</span>
          </div>
          {data.roomName && (
            <div className="flex justify-between">
              <span>Ruangan:</span>
              <span>{data.roomName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{data.cashierName}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t-2 border-dashed border-black pt-2 mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Harga</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-dashed border-gray-300">
                  <td className="py-2 text-left">{item.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{formatIDR(item.price)}</td>
                  <td className="py-2 text-right font-bold">{formatIDR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-black pt-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatIDR(data.subtotal)}</span>
          </div>
          {data.serviceCharge > 0 && (
            <div className="flex justify-between">
              <span>Service Charge:</span>
              <span>{formatIDR(data.serviceCharge)}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between">
              <span>PPN 11%:</span>
              <span>{formatIDR(data.tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t-2 border-black pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatIDR(data.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t-2 border-dashed border-black mt-2 pt-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Metode Bayar:</span>
            <span className="uppercase font-bold">{data.paymentMethod}</span>
          </div>
          {data.paidAmount && (
            <>
              <div className="flex justify-between">
                <span>Dibayar:</span>
                <span>{formatIDR(data.paidAmount)}</span>
              </div>
              {data.changeAmount && data.changeAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Kembalian:</span>
                  <span>{formatIDR(data.changeAmount)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs border-t-2 border-black pt-4">
          <p className="mb-2">Terima kasih atas kunjungan Anda!</p>
          <p className="mb-1">Barang yang sudah dibeli</p>
          <p>tidak dapat dikembalikan</p>
        </div>
      </div>
    );
  }
);

ReceiptPrint.displayName = "ReceiptPrint";
