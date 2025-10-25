import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign, ShoppingCart, LogOut, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  status: string;
  hourly_rate: number;
  current_session_start: string | null;
}

interface RoomDetailDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onAddItems: () => void;
  onEndSession: () => void;
}

export default function RoomDetailDialog({
  room,
  open,
  onOpenChange,
  onUpdate,
  onAddItems,
  onEndSession,
}: RoomDetailDialogProps) {
  const [duration, setDuration] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const { t } = useLanguage();

  const calculateDurationAndCost = () => {
    if (room?.current_session_start) {
      const start = new Date(room.current_session_start);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = diff / (1000 * 60 * 60);
      const minutes = (diff % (1000 * 60 * 60)) / (1000 * 60);

      const h = Math.floor(hours);
      const m = Math.floor(minutes);
      setDuration(`${h} ${t('common.hours')} ${m} ${t('common.minutes')}`);
      
      const cost = Math.ceil(hours) * room.hourly_rate;
      setEstimatedCost(cost);
    }
  };

  const fetchOrderedItems = async () => {
    if (room?.id) {
       const { data } = await supabase
        .from('room_orders')
        .select(`
          id,
          quantity,
          products ( name, price )
        `)
        .eq('room_id', room.id)
        .eq('is_paid', false)

      if (data) {
        setOrderedItems(data);
      }
    }
  }

  useEffect(() => {
    if (room && open) {
      calculateDurationAndCost();
      fetchOrderedItems();
      const interval = setInterval(() => {
        calculateDurationAndCost();
        fetchOrderedItems();
      }, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [room, open, t]);

  if (!room) return null;

  const totalItemsCost = orderedItems.reduce((acc, item) => acc + item.products.price * item.quantity, 0);
  const grandTotal = estimatedCost + totalItemsCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t('room_detail.title')} - {room.room_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Room & Session Info */}
          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>{t('room_detail.session_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between">
                  <p className="text-muted-foreground">{t('room_detail.status')}</p>
                  <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                     {t(`room_status.${room.status}`)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">{t('room_detail.hourly_rate')}</p>
                  <p className="font-semibold">Rp {room.hourly_rate.toLocaleString()}</p>
                </div>
                {room.current_session_start && (
                  <>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">{t('room_detail.duration')}</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {duration}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">{t('room_detail.estimated_room_cost')}</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Rp {estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
               <CardHeader>
                <CardTitle>{t('room_detail.total_estimation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg">
                  <p>{t('room_detail.room_cost')}</p>
                  <p>Rp {estimatedCost.toLocaleString()}</p>
                </div>
                 <div className="flex justify-between text-lg">
                  <p>{t('room_detail.items_cost')}</p>
                  <p>Rp {totalItemsCost.toLocaleString()}</p>
                </div>
                 <div className="flex justify-between text-xl font-bold">
                  <p>{t('room_detail.grand_total')}</p>
                  <p>Rp {grandTotal.toLocaleString()}</p>
                </div>
                 <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                    <Info className="h-4 w-4 mt-1 flex-shrink-0" />
                    <span>{t('room_detail.estimation_notice')}</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Side: Ordered Items */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t('room_detail.ordered_items')}</CardTitle>
              <Button size="sm" onClick={onAddItems} disabled={room.status !== 'occupied'}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {t('room_detail.add_item')}
              </Button>
            </CardHeader>
            <CardContent>
              {orderedItems.length > 0 ? (
                <ul className="space-y-3">
                  {orderedItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x Rp {item.products.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold">
                        Rp {(item.quantity * item.products.price).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('room_detail.no_items')}</p>
              )}
            </CardContent>
          </Card>
        </div>

         <DialogFooter className="mt-6">
            <Button 
              variant="destructive" 
              onClick={onEndSession}
              disabled={room.status !== 'occupied'}
            >
              <LogOut className="h-4 w-4 mr-2" />
             {t('room_detail.end_session_and_pay')}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
