import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign, ShoppingCart, LogOut, Info, Timer, Plus, AlertTriangle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import BookingTimeline from "./BookingTimeline";
import ExtendTimeDialog from "./ExtendTimeDialog";
import RoomBookingHistory from "./RoomBookingHistory";
import CashierFeatureMenu from "@/components/cashier/CashierFeatureMenu";

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
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const { t, language } = useLanguage();
  const { timeRemaining, isLowTime, booking } = useRoomTimer(room?.id || '', room?.status || '');

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
      // First get transactions for this room
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false });

      if (transactions && transactions.length > 0) {
        // Get all transaction IDs
        const transactionIds = transactions.map(t => t.id);
        
        // Fetch sales items for these transactions
        const { data } = await supabase
          .from('sales_items')
          .select(`
            id,
            quantity,
            unit_price,
            products (
              name_id,
              name_en
            )
          `)
          .in('transaction_id', transactionIds);

        if (data) {
          setOrderedItems(data);
        }
      } else {
        setOrderedItems([]);
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

  const totalItemsCost = orderedItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const grandTotal = estimatedCost + totalItemsCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {t('room_detail.title')} - {room.room_name}
            </DialogTitle>
            <CashierFeatureMenu
              roomId={room.id}
              roomName={room.room_name}
              totalAmount={grandTotal}
              onAddItems={onAddItems}
              onProcessPayment={onEndSession}
              onRequestDiscount={() => {}}
              onExtendTime={() => setExtendDialogOpen(true)}
            />
          </div>
        </DialogHeader>

        {/* Low Time Alert */}
        {isLowTime && booking && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('room_detail.low_time_warning')}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('room_detail.details_tab')}</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              {t('room_detail.history_tab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                    {timeRemaining && (
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">{t('room_detail.time_remaining')}</p>
                        <p className="font-semibold flex items-center gap-1 text-orange-600">
                          <Timer className="h-4 w-4" />
                          {timeRemaining}
                        </p>
                      </div>
                    )}
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

            {/* Booking Timeline */}
            {booking && (room.status === 'occupied' || room.status === 'reserved') && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('room_detail.booking_timeline')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingTimeline 
                    startTime={booking.start_time}
                    endTime={booking.end_time}
                    bookingDate={booking.booking_date}
                  />
                </CardContent>
              </Card>
            )}

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
                        <p className="font-semibold">{item.products[`name_${language === "id" ? "id" : "en"}`]}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x Rp {item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold">
                        Rp {(item.quantity * item.unit_price).toLocaleString()}
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

         <DialogFooter className="mt-6 flex gap-2">
            {room.status === 'available' && (
              <Button 
                onClick={() => {
                  // Start session for available room
                  onUpdate(); // This will trigger the parent to start the session
                  onOpenChange(false);
                }}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
            {booking && (room.status === 'occupied' || room.status === 'reserved') && (
              <Button 
                variant="outline"
                onClick={() => setExtendDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('room_detail.extend_time')}
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={onEndSession}
              disabled={room.status !== 'occupied'}
            >
              <LogOut className="h-4 w-4 mr-2" />
             {t('room_detail.end_session_and_pay')}
            </Button>
        </DialogFooter>
          </TabsContent>

          <TabsContent value="history">
            <RoomBookingHistory roomId={room.id} roomName={room.room_name} />
          </TabsContent>
        </Tabs>

        {/* Extend Time Dialog */}
        {booking && (
          <ExtendTimeDialog
            open={extendDialogOpen}
            onOpenChange={setExtendDialogOpen}
            bookingId={booking.id}
            hourlyRate={room.hourly_rate}
            onSuccess={() => {
              onUpdate();
              setExtendDialogOpen(false);
            }}
          />
        )}

      </DialogContent>
    </Dialog>
  );
}
