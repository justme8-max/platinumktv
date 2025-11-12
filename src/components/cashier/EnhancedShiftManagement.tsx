import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatIDR } from "@/lib/currency";
import { Clock, DollarSign, TrendingUp, FileText } from "lucide-react";

interface ShiftData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: string;
  total_sales: number;
  total_transactions: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  total_ewallet: number;
  total_discount: number;
  cash_difference: number;
  notes: string | null;
}

export function EnhancedShiftManagement() {
  const [activeShift, setActiveShift] = useState<ShiftData | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkActiveShift();
  }, []);

  const checkActiveShift = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking shift:", error);
      return;
    }

    if (data) {
      // Calculate real-time totals
      await updateShiftTotals(data.id);
      // Reload shift data
      const { data: updatedShift } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", data.id)
        .single();
      setActiveShift(updatedShift);
    }
  };

  const updateShiftTotals = async (shiftId: string) => {
    const shift = await supabase
      .from("shifts")
      .select("start_time")
      .eq("id", shiftId)
      .single();

    if (!shift.data) return;

    // Get transactions during this shift
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", shift.data.start_time);

    if (!transactions) return;

    const totals = transactions.reduce(
      (acc, t) => {
        acc.total_sales += Number(t.final_amount || 0);
        acc.total_transactions += 1;
        
        switch (t.payment_method) {
          case "cash":
            acc.total_cash += Number(t.final_amount || 0);
            break;
          case "card":
            acc.total_card += Number(t.final_amount || 0);
            break;
          case "transfer":
            acc.total_transfer += Number(t.final_amount || 0);
            break;
          case "ewallet":
            acc.total_ewallet += Number(t.final_amount || 0);
            break;
        }
        
        return acc;
      },
      {
        total_sales: 0,
        total_transactions: 0,
        total_cash: 0,
        total_card: 0,
        total_transfer: 0,
        total_ewallet: 0,
      }
    );

    // Update shift with totals
    await supabase
      .from("shifts")
      .update(totals)
      .eq("id", shiftId);
  };

  const handleStartShift = async () => {
    if (!openingBalance) {
      toast({
        title: "Error",
        description: "Mohon masukkan saldo awal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shifts")
      .insert({
        user_id: user.id,
        opening_balance: Number(openingBalance),
        status: "active",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memulai shift",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setActiveShift(data);
    setOpeningBalance("");
    toast({
      title: "Shift Dimulai",
      description: "Shift kasir berhasil dimulai",
    });
    setLoading(false);
  };

  const handleEndShift = async () => {
    if (!closingBalance) {
      toast({
        title: "Error",
        description: "Mohon masukkan saldo akhir",
        variant: "destructive",
      });
      return;
    }

    if (!activeShift) return;

    setLoading(true);

    // Update shift totals first
    await updateShiftTotals(activeShift.id);

    const cashDifference =
      Number(closingBalance) -
      (activeShift.opening_balance + activeShift.total_cash);

    const { error } = await supabase
      .from("shifts")
      .update({
        closing_balance: Number(closingBalance),
        cash_difference: cashDifference,
        end_time: new Date().toISOString(),
        status: "closed",
        notes: notes || null,
      })
      .eq("id", activeShift.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menutup shift",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Shift Ditutup",
      description: "Shift kasir berhasil ditutup",
    });

    setActiveShift(null);
    setClosingBalance("");
    setNotes("");
    setLoading(false);
  };

  if (!activeShift) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Mulai Shift
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="openingBalance">Saldo Awal (IDR)</Label>
            <Input
              id="openingBalance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button
            onClick={handleStartShift}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Mulai Shift
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Shift Aktif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Mulai</Label>
              <p className="font-medium text-foreground">
                {new Date(activeShift.start_time).toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Saldo Awal</Label>
              <p className="font-medium text-primary">
                {formatIDR(activeShift.opening_balance)}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Transaksi</span>
              <span className="font-bold text-foreground">{activeShift.total_transactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Penjualan</span>
              <span className="font-bold text-primary">
                {formatIDR(activeShift.total_sales)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cash</span>
              <span className="text-foreground">{formatIDR(activeShift.total_cash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Card</span>
              <span className="text-foreground">{formatIDR(activeShift.total_card)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer</span>
              <span className="text-foreground">{formatIDR(activeShift.total_transfer)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">E-Wallet</span>
              <span className="text-foreground">{formatIDR(activeShift.total_ewallet)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="closingBalance">Saldo Akhir (IDR)</Label>
            <Input
              id="closingBalance"
              type="number"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              placeholder="0"
              className="mb-2"
            />
            {closingBalance && (
              <p className="text-sm text-muted-foreground mb-2">
                Selisih Cash:{" "}
                <span
                  className={
                    Number(closingBalance) - (activeShift.opening_balance + activeShift.total_cash) >= 0
                      ? "text-success"
                      : "text-destructive"
                  }
                >
                  {formatIDR(
                    Number(closingBalance) -
                      (activeShift.opening_balance + activeShift.total_cash)
                  )}
                </span>
              </p>
            )}
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan shift..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleEndShift}
            disabled={loading}
            className="w-full bg-destructive hover:bg-destructive/90"
          >
            <FileText className="mr-2 h-4 w-4" />
            Tutup Shift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
