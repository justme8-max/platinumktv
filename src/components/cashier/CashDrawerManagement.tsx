import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/currency";

interface CashDrawer {
  id: string;
  opening_balance: number;
  current_balance: number;
  total_cash_in: number;
  total_cash_out: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
}

interface CashTransaction {
  type: 'in' | 'out';
  amount: number;
  description: string;
}

export default function CashDrawerManagement() {
  const [drawer, setDrawer] = useState<CashDrawer | null>(null);
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [transactionDialogVisible, setTransactionDialogVisible] = useState(false);
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [transaction, setTransaction] = useState<CashTransaction>({
    type: 'in',
    amount: 0,
    description: ''
  });
  const [closingCash, setClosingCash] = useState("");

  useEffect(() => {
    loadDrawer();
  }, []);

  const loadDrawer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for open drawer
    const { data } = await supabase
      .from('cash_drawers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (data) setDrawer(data as any);
  };

  const handleOpenDrawer = async () => {
    const amount = parseFloat(openingBalance);
    if (isNaN(amount) || amount < 0) {
      toast.error("Masukkan saldo awal yang valid");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('cash_drawers')
        .insert({
          user_id: user.id,
          opening_balance: amount,
          current_balance: amount,
          total_cash_in: 0,
          total_cash_out: 0,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setDrawer(data as any);
      setOpenDialogVisible(false);
      setOpeningBalance("");
      toast.success("Laci kas dibuka");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTransaction = async () => {
    if (!drawer) return;
    
    if (transaction.amount <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }

    if (!transaction.description.trim()) {
      toast.error("Masukkan keterangan");
      return;
    }

    try {
      const newBalance = transaction.type === 'in' 
        ? drawer.current_balance + transaction.amount
        : drawer.current_balance - transaction.amount;

      if (newBalance < 0) {
        toast.error("Saldo tidak cukup");
        return;
      }

      const updates: any = {
        current_balance: newBalance
      };

      if (transaction.type === 'in') {
        updates.total_cash_in = drawer.total_cash_in + transaction.amount;
      } else {
        updates.total_cash_out = drawer.total_cash_out + transaction.amount;
      }

      const { error: updateError } = await supabase
        .from('cash_drawers')
        .update(updates)
        .eq('id', drawer.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: logError } = await supabase
        .from('cash_drawer_transactions')
        .insert({
          drawer_id: drawer.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description
        });

      if (logError) throw logError;

      toast.success(`Transaksi ${transaction.type === 'in' ? 'masuk' : 'keluar'} berhasil`);
      setTransactionDialogVisible(false);
      setTransaction({ type: 'in', amount: 0, description: '' });
      loadDrawer();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCloseDrawer = async () => {
    if (!drawer) return;

    const actualCash = parseFloat(closingCash);
    if (isNaN(actualCash) || actualCash < 0) {
      toast.error("Masukkan jumlah kas yang valid");
      return;
    }

    try {
      const difference = actualCash - drawer.current_balance;

      const { error } = await supabase
        .from('cash_drawers')
        .update({
          status: 'closed',
          closing_balance: actualCash,
          cash_difference: difference,
          closed_at: new Date().toISOString()
        })
        .eq('id', drawer.id);

      if (error) throw error;

      toast.success("Laci kas ditutup");
      setCloseDialogVisible(false);
      setClosingCash("");
      setDrawer(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Manajemen Laci Kas
          </CardTitle>
          <CardDescription>
            Kelola kas harian Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!drawer ? (
            <Button onClick={() => setOpenDialogVisible(true)} className="w-full">
              Buka Laci Kas
            </Button>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Saat Ini</p>
                    <p className="text-2xl font-bold">{formatIDR(drawer.current_balance)}</p>
                  </div>
                  <Badge variant="default">Buka</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-success">
                        <TrendingUp className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kas Masuk</p>
                          <p className="font-semibold">{formatIDR(drawer.total_cash_in)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <TrendingDown className="h-4 w-4" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kas Keluar</p>
                          <p className="font-semibold">{formatIDR(drawer.total_cash_out)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setTransaction({ ...transaction, type: 'in' });
                      setTransactionDialogVisible(true);
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Kas Masuk
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setTransaction({ ...transaction, type: 'out' });
                      setTransactionDialogVisible(true);
                    }}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Kas Keluar
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setCloseDialogVisible(true)}
                >
                  Tutup Laci Kas
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Open Drawer Dialog */}
      <Dialog open={openDialogVisible} onOpenChange={setOpenDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Laci Kas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Saldo Awal</Label>
              <Input
                type="number"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogVisible(false)}>
              Batal
            </Button>
            <Button onClick={handleOpenDrawer}>Buka</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogVisible} onOpenChange={setTransactionDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transaction.type === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                value={transaction.amount || ''}
                onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input
                placeholder="Keterangan transaksi"
                value={transaction.description}
                onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogVisible(false)}>
              Batal
            </Button>
            <Button onClick={handleTransaction}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Drawer Dialog */}
      <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Laci Kas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Sistem</p>
              <p className="text-2xl font-bold">{formatIDR(drawer?.current_balance || 0)}</p>
            </div>
            <div>
              <Label>Jumlah Kas Aktual</Label>
              <Input
                type="number"
                placeholder="0"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
              />
            </div>
            {closingCash && drawer && (
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Selisih</p>
                <p className={`text-xl font-bold ${
                  parseFloat(closingCash) - drawer.current_balance >= 0 
                    ? 'text-success' 
                    : 'text-destructive'
                }`}>
                  {formatIDR(Math.abs(parseFloat(closingCash) - drawer.current_balance))}
                  {parseFloat(closingCash) - drawer.current_balance >= 0 ? ' (Lebih)' : ' (Kurang)'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogVisible(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleCloseDrawer}>
              Tutup Laci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
