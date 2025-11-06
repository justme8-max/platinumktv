import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, CreditCard, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  final_amount: number;
  payment_method: string;
  transaction_type: string;
  created_at: string;
  session_start: string | null;
  session_end: string | null;
  duration_hours: number | null;
  description: string | null;
}

interface RoomTransactionHistoryProps {
  roomId: string;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoomTransactionHistory({
  roomId,
  roomName,
  open,
  onOpenChange,
}: RoomTransactionHistoryProps) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_transactions: 0,
    avg_transaction: 0,
  });

  useEffect(() => {
    if (open && roomId) {
      loadTransactions();
    }
  }, [open, roomId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data);
        
        // Calculate stats
        const total = data.reduce((sum, t) => sum + Number(t.final_amount || t.amount), 0);
        setStats({
          total_revenue: total,
          total_transactions: data.length,
          avg_transaction: data.length > 0 ? total / data.length : 0,
        });
      }
    } catch (error: any) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu",
      bank_transfer: "Transfer Bank",
      e_wallet: "E-Wallet",
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-green-100 text-green-800",
      card: "bg-blue-100 text-blue-800",
      bank_transfer: "bg-purple-100 text-purple-800",
      e_wallet: "bg-orange-100 text-orange-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📊 Riwayat Transaksi - {roomName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Omset</p>
                      <p className="text-2xl font-bold">{formatIDR(stats.total_revenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transaksi</p>
                      <p className="text-2xl font-bold">{stats.total_transactions}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rata-rata</p>
                      <p className="text-2xl font-bold">{formatIDR(stats.avg_transaction)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daftar Transaksi</h3>
              
              {transactions.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">
                      Belum ada transaksi untuk ruangan ini
                    </p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(transaction.created_at), "dd MMM yyyy, HH:mm")}
                              </span>
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getPaymentMethodColor(transaction.payment_method)}>
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </Badge>
                        </div>

                        {/* Session Info */}
                        {transaction.session_start && transaction.duration_hours && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{transaction.duration_hours} jam</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Mulai: {format(new Date(transaction.session_start), "HH:mm")}</span>
                            </div>
                            {transaction.session_end && (
                              <div className="flex items-center gap-1">
                                <span>Selesai: {format(new Date(transaction.session_end), "HH:mm")}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Amount */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Total Pembayaran:</span>
                          <span className="text-xl font-bold text-primary">
                            {formatIDR(transaction.final_amount || transaction.amount)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
