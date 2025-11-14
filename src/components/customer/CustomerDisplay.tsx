import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Clock } from "lucide-react";
import { formatIDR } from "@/lib/currency";

interface DisplayItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function CustomerDisplay() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const channel = supabase
      .channel('customer-display')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fb_order_items'
        },
        () => {
          // In production, you'd load the current cart/order being processed
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // This would be updated from the POS system when items are scanned/added
  const addItem = (item: DisplayItem) => {
    const existingIndex = items.findIndex(i => i.name === item.name);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += item.quantity;
      newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      setItems([...items, item]);
    }
    setTotal(prev => prev + item.subtotal);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <Card className="max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-3xl text-center flex items-center justify-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Display Pelanggan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{lastUpdate.toLocaleTimeString('id-ID')}</span>
              </div>
              <Badge variant="outline">
                {items.length} Item
              </Badge>
            </div>

            <Separator />

            {/* Items List */}
            <div className="space-y-4 min-h-[300px]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-xl">Menunggu item...</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-start p-4 bg-muted/30 rounded-lg animate-fade-in"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatIDR(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-bold text-xl">
                      {formatIDR(item.subtotal)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Total */}
            <div className="bg-primary/10 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold">Total</span>
                <span className="text-4xl font-bold text-primary">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center text-muted-foreground text-sm pt-4">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Selamat menikmati</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
