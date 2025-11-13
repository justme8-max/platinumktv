import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building, 
  Receipt,
  Loader2,
  CheckCircle
} from "lucide-react";
import { formatIDR } from "@/lib/currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface Room {
  id: string;
  room_name: string;
  room_number: string;
  hourly_rate: number;
  current_session_start: string | null;
}

interface ReceiptData {
  roomName: string;
  roomNumber: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: any[];
  roomCost: number;
  durationHours: number;
  subtotal: number;
  serviceCharge: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

interface PaymentDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (receiptData: ReceiptData) => void;
}

type PaymentMethod = "cash" | "card" | "transfer" | "ewallet";

export default function PaymentDialog({
  room,
  open,
  onOpenChange,
  onSuccess,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [amounts, setAmounts] = useState({
    roomCost: 0,
    itemsCost: 0,
    subtotal: 0,
    serviceCharge: 0,
    taxAmount: 0,
    finalAmount: 0,
    durationHours: 0,
  });
  const { t } = useLanguage();

  useEffect(() => {
    if (room && open) {
      calculateAmounts();
    }
  }, [room, open]);

  const calculateAmounts = async () => {
    if (!room?.current_session_start) return;

    setCalculating(true);
    try {
      // Calculate room cost
      const start = new Date(room.current_session_start);
      const end = new Date();
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const durationHours = Math.ceil(hours);
      const roomCost = durationHours * room.hourly_rate;

      // Get ordered items cost
      const { data: items } = await supabase
        .from("sales_items")
        .select("quantity, unit_price")
        .eq("transaction_id", room.id);

      const itemsCost = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
      const subtotal = roomCost + itemsCost;

      // Get tax settings
      const { data: taxSettings } = await supabase
        .from("tax_settings")
        .select("rate")
        .eq("is_active", true)
        .single();

      const taxRate = taxSettings?.rate || 11;
      
      // Calculate using the database function
      const { data: calculation } = await supabase
        .rpc("calculate_transaction_total", {
          p_subtotal: subtotal,
          p_tax_rate: taxRate,
          p_service_charge_rate: 0, // No service charge for now
        })
        .single();

      if (calculation) {
        setAmounts({
          roomCost,
          itemsCost,
          subtotal: Number(calculation.subtotal),
          serviceCharge: Number(calculation.service_charge),
          taxAmount: Number(calculation.tax_amount),
          finalAmount: Number(calculation.final_amount),
          durationHours,
        });
      }
    } catch (error: any) {
      toast.error(`Failed to calculate: ${error.message}`);
    } finally {
      setCalculating(false);
    }
  };

  const handlePayment = async () => {
    if (!room) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get user profile for cashier name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      // Get ordered items
      const { data: orderedItems } = await supabase
        .from("fb_order_items")
        .select(`
          quantity,
          unit_price,
          subtotal,
          products (name_id, name_en)
        `)
        .eq("order_id", room.id);

      // Create transaction and get the generated receipt number
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          room_id: room.id,
          cashier_id: user?.id,
          transaction_type: "room_rental",
          amount: amounts.finalAmount,
          subtotal: amounts.subtotal,
          tax_amount: amounts.taxAmount,
          tax_rate: 11,
          service_charge: amounts.serviceCharge,
          final_amount: amounts.finalAmount,
          payment_method: paymentMethod,
          session_start: room.current_session_start,
          session_end: new Date().toISOString(),
          duration_hours: amounts.durationHours,
          description: `${room.room_name} - ${amounts.durationHours} hours`,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update room status
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          status: "available",
          current_session_start: null,
        })
        .eq("id", room.id);

      if (roomError) throw roomError;

      // Prepare receipt data
      const receiptData: ReceiptData = {
        roomName: room.room_name,
        roomNumber: room.room_number,
        receiptNumber: transactionData.receipt_number || 'N/A',
        date: new Date().toLocaleString('id-ID'),
        cashier: profile?.full_name || 'Cashier',
        items: orderedItems?.map(item => ({
          name: item.products?.name_id || item.products?.name_en || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })) || [],
        roomCost: amounts.roomCost,
        durationHours: amounts.durationHours,
        subtotal: amounts.subtotal,
        serviceCharge: amounts.serviceCharge,
        taxAmount: amounts.taxAmount,
        totalAmount: amounts.finalAmount,
        paymentMethod: paymentMethod,
      };

      toast.success("Payment processed successfully!");
      onSuccess(receiptData);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: Banknote, color: "text-green-600" },
    { value: "card", label: "Card", icon: CreditCard, color: "text-blue-600" },
    { value: "transfer", label: "Bank Transfer", icon: Building, color: "text-purple-600" },
    { value: "ewallet", label: "E-Wallet", icon: Smartphone, color: "text-orange-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Complete payment for {room.room_name}
          </DialogDescription>
        </DialogHeader>

        {calculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Amount Breakdown */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room ({amounts.durationHours}h)</span>
                  <span className="font-medium">{formatIDR(amounts.roomCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{formatIDR(amounts.itemsCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatIDR(amounts.subtotal)}</span>
                </div>
                {amounts.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span className="font-medium">{formatIDR(amounts.serviceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (PPN 11%)</span>
                  <span className="font-medium">{formatIDR(amounts.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatIDR(amounts.finalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="grid grid-cols-2 gap-3"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Label
                      key={method.value}
                      htmlFor={method.value}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                        transition-all hover:bg-accent/50
                        ${paymentMethod === method.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border'
                        }
                      `}
                    >
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        className="sr-only"
                      />
                      <Icon className={`h-6 w-6 ${method.color}`} />
                      <span className="text-sm font-medium">{method.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || calculating}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pay {formatIDR(amounts.finalAmount)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
