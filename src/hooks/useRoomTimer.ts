import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RoomBooking {
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export function useRoomTimer(roomId: string, roomStatus: string) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [booking, setBooking] = useState<RoomBooking | null>(null);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      if (roomStatus !== 'occupied' && roomStatus !== 'reserved') {
        setTimeRemaining('');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, start_time, end_time, status')
        .eq('room_id', roomId)
        .gte('booking_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setBooking(data);
      }
    };

    fetchActiveBooking();
  }, [roomId, roomStatus]);

  useEffect(() => {
    if (!booking) {
      setTimeRemaining('');
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const bookingDate = booking.booking_date;
      const endTime = booking.end_time;
      
      // Combine date and time
      const endDateTime = new Date(`${bookingDate}T${endTime}`);
      
      const diff = endDateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [booking]);

  return { timeRemaining, booking };
}
