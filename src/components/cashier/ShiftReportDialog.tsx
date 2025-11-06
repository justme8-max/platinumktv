import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/currency";
import { Printer, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShiftReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId?: string;
}

export default function ShiftReportDialog({ open, onOpenChange, shiftId }: ShiftReportDialogProps) {
  const { t } = useLanguage();
  const [shift, setShift] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && shiftId) {
      loadShiftData();
    }
  }, [open, shiftId]);

  const loadShiftData = async () => {
    setLoading(true);
    try {
      // Load shift data
      const { data: shiftData } = await supabase
        .from("shifts")
        .select("*, profiles:user_id(full_name)")
        .eq("id", shiftId)
        .single();

      if (shiftData) {
        setShift(shiftData);

        // Load transactions for this shift
        const { data: transData } = await supabase
          .from("transactions")
          .select("*, rooms(room_name)")
          .gte("created_at", shiftData.start_time)
          .lte("created_at", shiftData.end_time || new Date().toISOString())
          .order("created_at", { ascending: false });

        setTransactions(transData || []);
      }
    } catch (error) {
      console.error("Error loading shift data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvData = [
      ['Laporan Shift Kasir'],
      [''],
      ['Kasir:', shift?.profiles?.full_name || '-'],
      ['Mulai Shift:', new Date(shift?.start_time).toLocaleString()],
      ['Selesai Shift:', shift?.end_time ? new Date(shift.end_time).toLocaleString() : 'Masih berjalan'],
      [''],
      ['Ringkasan Transaksi:'],
      ['Total Transaksi:', shift?.total_transactions || 0],
      ['Cash:', formatIDR(shift?.total_cash || 0)],
      ['Transfer:', formatIDR(shift?.total_transfer || 0)],
      ['E-Wallet:', formatIDR(shift?.total_ewallet || 0)],
      ['Card:', formatIDR(shift?.total_card || 0)],
      [''],
      ['Waktu', 'Ruangan', 'Metode Pembayaran', 'Jumlah'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleString(),
        t.rooms?.room_name || t.description || '-',
        t.payment_method,
        formatIDR(t.final_amount || t.amount)
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Laporan Shift Kasir</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 print:p-8">
          {/* Header Info */}
          <Card className="p-6 print:shadow-none">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kasir</p>
                <p className="font-semibold">{shift?.profiles?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{shift?.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mulai Shift</p>
                <p className="font-semibold">
                  {shift?.start_time ? new Date(shift.start_time).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selesai Shift</p>
                <p className="font-semibold">
                  {shift?.end_time ? new Date(shift.end_time).toLocaleString() : 'Masih berjalan'}
                </p>
              </div>
            </div>
          </Card>

          {/* Financial Summary */}
          <Card className="p-6 print:shadow-none">
            <h3 className="font-semibold mb-4">Ringkasan Keuangan</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Awal</p>
                <p className="text-xl font-bold">{formatIDR(shift?.opening_balance || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-xl font-bold">{shift?.total_transactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Akhir</p>
                <p className="text-xl font-bold">
                  {formatIDR(shift?.closing_balance || 
                    (shift?.opening_balance || 0) + 
                    (shift?.total_cash || 0) + 
                    (shift?.total_transfer || 0) + 
                    (shift?.total_ewallet || 0) + 
                    (shift?.total_card || 0)
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-lg font-semibold text-green-600">{formatIDR(shift?.total_cash || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transfer</p>
                <p className="text-lg font-semibold text-blue-600">{formatIDR(shift?.total_transfer || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-Wallet</p>
                <p className="text-lg font-semibold text-purple-600">{formatIDR(shift?.total_ewallet || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Card</p>
                <p className="text-lg font-semibold text-orange-600">{formatIDR(shift?.total_card || 0)}</p>
              </div>
            </div>
          </Card>

          {/* Transactions List */}
          <Card className="p-6 print:shadow-none">
            <h3 className="font-semibold mb-4">Detail Transaksi ({transactions.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((trans) => (
                <div key={trans.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{trans.rooms?.room_name || trans.description || '-'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trans.created_at).toLocaleString()} • {trans.payment_method}
                    </p>
                  </div>
                  <p className="font-semibold">{formatIDR(trans.final_amount || trans.amount)}</p>
                </div>
              ))}
            </div>
          </Card>

          {shift?.notes && (
            <Card className="p-6 print:shadow-none">
              <h3 className="font-semibold mb-2">Catatan</h3>
              <p className="text-sm text-muted-foreground">{shift.notes}</p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}