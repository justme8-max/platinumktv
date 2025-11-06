import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";

interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string;
  currentAmount?: number;
}

export default function ApprovalRequestDialog({
  open,
  onOpenChange,
  roomId,
  currentAmount = 0,
}: ApprovalRequestDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  const [requestType, setRequestType] = useState<"discount" | "minimum_charge">("discount");
  const [amountType, setAmountType] = useState<"fixed" | "percentage">("fixed");
  const [amount, setAmount] = useState("");
  const [percentage, setPercentage] = useState("");
  const [reason, setReason] = useState("");

  const calculateAmount = () => {
    if (amountType === "fixed") {
      return parseFloat(amount) || 0;
    } else {
      const perc = parseFloat(percentage) || 0;
      return (currentAmount * perc) / 100;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const calculatedAmount = calculateAmount();
      
      if (calculatedAmount <= 0) {
        toast.error(t("approval.invalidAmount"));
        setLoading(false);
        return;
      }

      if (!reason.trim()) {
        toast.error(t("approval.reasonRequired"));
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("approval_requests")
        .insert({
          request_type: requestType,
          room_id: roomId,
          amount: calculatedAmount,
          percentage: amountType === "percentage" ? parseFloat(percentage) : null,
          reason: reason.trim(),
          requested_by: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast.success(t("approval.requestSent"));
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      
      // Reset form
      setAmount("");
      setPercentage("");
      setReason("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("approval.requestTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("approval.requestType")}</Label>
            <RadioGroup value={requestType} onValueChange={(val: any) => setRequestType(val)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="discount" id="discount" />
                <Label htmlFor="discount" className="font-normal cursor-pointer">
                  {t("approval.discount")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimum_charge" id="minimum_charge" />
                <Label htmlFor="minimum_charge" className="font-normal cursor-pointer">
                  {t("approval.minimumCharge")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{t("approval.amountType")}</Label>
            <RadioGroup value={amountType} onValueChange={(val: any) => setAmountType(val)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  {t("approval.fixedAmount")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  {t("approval.percentage")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {amountType === "fixed" ? (
            <div className="space-y-2">
              <Label>{t("approval.amount")}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("approval.percentageValue")}</Label>
              <Input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                required
              />
            </div>
          )}

          {currentAmount > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t("approval.calculatedAmount")}</p>
              <p className="text-xl font-bold">{formatIDR(calculateAmount())}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("approval.reason")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("approval.reasonPlaceholder")}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("approval.sendRequest")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
