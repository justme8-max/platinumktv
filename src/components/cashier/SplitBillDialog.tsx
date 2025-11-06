import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Split, Minus, Plus, Users, DollarSign } from "lucide-react";
import { formatIDR } from "@/lib/currency";

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onSplit: (splits: number[]) => void;
}

export default function SplitBillDialog({
  open,
  onOpenChange,
  totalAmount,
  onSplit,
}: SplitBillDialogProps) {
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customSplits, setCustomSplits] = useState<number[]>([]);

  const handleEqualSplit = () => {
    const amount = Math.floor(totalAmount / numberOfSplits);
    const remainder = totalAmount - (amount * numberOfSplits);
    const splits = Array(numberOfSplits).fill(amount);
    if (remainder > 0) splits[0] += remainder;
    return splits;
  };

  const handleCustomSplitChange = (index: number, value: string) => {
    const newSplits = [...customSplits];
    newSplits[index] = parseFloat(value) || 0;
    setCustomSplits(newSplits);
  };

  const initializeCustomSplits = () => {
    setSplitType("custom");
    const equalAmount = Math.floor(totalAmount / numberOfSplits);
    setCustomSplits(Array(numberOfSplits).fill(equalAmount));
  };

  const getTotalCustomSplits = () => {
    return customSplits.reduce((sum, amount) => sum + amount, 0);
  };

  const handleConfirm = () => {
    const splits = splitType === "equal" ? handleEqualSplit() : customSplits;
    onSplit(splits);
    onOpenChange(false);
  };

  const remaining = splitType === "custom" ? totalAmount - getTotalCustomSplits() : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Bill
          </DialogTitle>
          <DialogDescription>
            Bagi tagihan untuk beberapa pembayaran
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Total Tagihan</span>
              <span className="text-2xl font-bold text-primary">
                {formatIDR(totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Jumlah Pembayaran</Label>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSplits(Math.max(2, numberOfSplits - 1))}
                disabled={numberOfSplits <= 2}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="text-lg px-4">
                <Users className="h-4 w-4 mr-2" />
                {numberOfSplits}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNumberOfSplits(Math.min(10, numberOfSplits + 1))}
                disabled={numberOfSplits >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={splitType === "equal" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSplitType("equal")}
            >
              Bagi Rata
            </Button>
            <Button
              variant={splitType === "custom" ? "default" : "outline"}
              className="flex-1"
              onClick={initializeCustomSplits}
            >
              Custom Amount
            </Button>
          </div>

          <Separator />

          {splitType === "equal" ? (
            <div className="space-y-2">
              {handleEqualSplit().map((amount, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg bg-accent"
                >
                  <span className="font-medium">Pembayaran {index + 1}</span>
                  <span className="font-bold">{formatIDR(amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: numberOfSplits }).map((_, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`split-${index}`}>Pembayaran {index + 1}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`split-${index}`}
                      type="number"
                      value={customSplits[index] || ""}
                      onChange={(e) => handleCustomSplitChange(index, e.target.value)}
                      placeholder="0"
                      className="flex-1"
                    />
                    <div className="flex items-center text-sm text-muted-foreground min-w-[100px]">
                      {formatIDR(customSplits[index] || 0)}
                    </div>
                  </div>
                </div>
              ))}
              
              {remaining !== 0 && (
                <Card className={remaining > 0 ? "border-orange-500" : "border-red-500"}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {remaining > 0 ? "Sisa" : "Kelebihan"}
                      </span>
                      <span className={`font-bold ${remaining > 0 ? "text-orange-500" : "text-red-500"}`}>
                        {formatIDR(Math.abs(remaining))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={splitType === "custom" && remaining !== 0}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Konfirmasi Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
