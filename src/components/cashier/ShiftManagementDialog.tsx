import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  LogIn, 
  LogOut,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { formatIDR } from "@/lib/currency";

interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  total_transactions: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  total_ewallet: number;
  status: "active" | "closed";
}

export default function ShiftManagementDialog() {
  const [open, setOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      checkActiveShift();
    }
  }, [open]);

  const checkActiveShift = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if there's an active shift
    const { data: shifts } = await supabase
      .from("shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (shifts) {
      // Calculate transaction totals
      const { data: transactions } = await supabase
        .from("transactions")
        .select("payment_method, final_amount")
        .gte("created_at", shifts.start_time);

      if (transactions) {
        const totals = transactions.reduce(
          (acc, t) => {
            acc.total += Number(t.final_amount);
            acc[t.payment_method] = (acc[t.payment_method] || 0) + Number(t.final_amount);
            return acc;
          },
          { total: 0, cash: 0, card: 0, transfer: 0, ewallet: 0 }
        );

        setActiveShift({
          ...shifts,
          status: shifts.status as "active" | "closed",
          total_transactions: transactions.length,
          total_cash: totals.cash,
          total_card: totals.card,
          total_transfer: totals.transfer,
          total_ewallet: totals.ewallet,
        });
      }
    }
  };

  const handleStartShift = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const balance = parseFloat(openingBalance);
      if (isNaN(balance) || balance < 0) {
        throw new Error("Invalid opening balance");
      }

      const { error } = await supabase.from("shifts").insert({
        user_id: user.id,
        opening_balance: balance,
        status: "active",
      });

      if (error) throw error;

      toast.success("Shift started successfully!");
      setOpeningBalance("");
      checkActiveShift();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    setLoading(true);
    try {
      const balance = parseFloat(closingBalance);
      if (isNaN(balance) || balance < 0) {
        throw new Error("Invalid closing balance");
      }

      const { error } = await supabase
        .from("shifts")
        .update({
          end_time: new Date().toISOString(),
          closing_balance: balance,
          status: "closed",
          total_transactions: activeShift.total_transactions,
          total_cash: activeShift.total_cash,
          total_card: activeShift.total_card,
          total_transfer: activeShift.total_transfer,
          total_ewallet: activeShift.total_ewallet,
        })
        .eq("id", activeShift.id);

      if (error) throw error;

      const variance = balance - (activeShift.opening_balance + activeShift.total_cash);
      
      toast.success(
        <>
          <div className="font-semibold mb-2">Shift Closed!</div>
          <div className="text-sm space-y-1">
            <div>Expected Cash: {formatIDR(activeShift.opening_balance + activeShift.total_cash)}</div>
            <div>Actual Cash: {formatIDR(balance)}</div>
            <div className={variance === 0 ? "text-green-500" : "text-orange-500"}>
              Variance: {formatIDR(variance)}
            </div>
          </div>
        </>,
        { duration: 5000 }
      );

      setClosingBalance("");
      setActiveShift(null);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const expectedClosingCash = activeShift 
    ? activeShift.opening_balance + activeShift.total_cash
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Shift Management
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Management
          </DialogTitle>
          <DialogDescription>
            Kelola shift kasir dan cash drawer
          </DialogDescription>
        </DialogHeader>

        {!activeShift ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No Active Shift</p>
                    <p className="text-sm text-muted-foreground">
                      Start a new shift to begin transactions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="opening-balance">Opening Cash Balance</Label>
              <Input
                id="opening-balance"
                type="number"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Jumlah uang tunai di laci saat mulai shift
              </p>
            </div>

            <Button
              onClick={handleStartShift}
              disabled={loading || !openingBalance}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Start Shift
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Active Shift</CardTitle>
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">
                    {new Date(activeShift.start_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.floor((Date.now() - new Date(activeShift.start_time).getTime()) / (1000 * 60))} minutes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Opening Balance</span>
                  <span className="font-medium">
                    {formatIDR(activeShift.opening_balance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Shift Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{activeShift.total_transactions}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">💵 Cash</span>
                  <span>{formatIDR(activeShift.total_cash)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">💳 Card</span>
                  <span>{formatIDR(activeShift.total_card)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">🏦 Transfer</span>
                  <span>{formatIDR(activeShift.total_transfer)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">📱 E-Wallet</span>
                  <span>{formatIDR(activeShift.total_ewallet)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Expected Closing Cash</span>
                  <span className="text-primary">{formatIDR(expectedClosingCash)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="closing-balance">Actual Closing Cash</Label>
              <Input
                id="closing-balance"
                type="number"
                placeholder="0"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Hitung uang tunai aktual di laci sebelum tutup shift
              </p>
            </div>

            <Button
              onClick={handleEndShift}
              disabled={loading || !closingBalance}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              End Shift
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
