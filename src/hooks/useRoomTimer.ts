import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoomBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export function useRoomTimer(roomId: string, roomStatus: string) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);
  const [isLowTime, setIsLowTime] = useState<boolean>(false);
  const [booking, setBooking] = useState<RoomBooking | null>(null);
  const [hasAlerted, setHasAlerted] = useState<boolean>(false);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      if (roomStatus !== 'occupied' && roomStatus !== 'reserved') {
        setTimeRemaining('');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, start_time, end_time, status')
        .eq('room_id', roomId)
        .gte('booking_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setBooking(data);
        setHasAlerted(false); // Reset alert when new booking is fetched
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
        setMinutesRemaining(0);
        setIsLowTime(false);
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
      setMinutesRemaining(totalMinutes);
      
      // Check if time is running low (15 minutes or less)
      const lowTimeThreshold = 15;
      if (totalMinutes <= lowTimeThreshold && totalMinutes > 0) {
        setIsLowTime(true);
        
        // Show alert only once
        if (!hasAlerted) {
          toast.warning('⏰ Time Running Out!', {
            description: `Only ${totalMinutes} minutes remaining for this booking.`,
            duration: 5000,
          });
          setHasAlerted(true);
        }
      } else {
        setIsLowTime(false);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [booking, hasAlerted]);

  return { timeRemaining, minutesRemaining, isLowTime, booking };
}
