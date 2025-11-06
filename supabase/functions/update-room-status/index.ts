import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)

    console.log(`Checking expired bookings at ${currentDate} ${currentTime}`)

    // Find all bookings that have expired (end_time has passed)
    const { data: expiredBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, room_id, end_time, booking_date, status')
      .in('status', ['confirmed', 'pending'])
      .lte('booking_date', currentDate)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    const expiredBookingIds: string[] = []
    const roomsToUpdate: string[] = []

    // Check which bookings have actually expired
    for (const booking of expiredBookings || []) {
      const bookingEndDateTime = new Date(`${booking.booking_date}T${booking.end_time}`)
      
      if (now > bookingEndDateTime) {
        expiredBookingIds.push(booking.id)
        roomsToUpdate.push(booking.room_id)
        console.log(`Booking ${booking.id} for room ${booking.room_id} has expired`)
      }
    }

    if (expiredBookingIds.length === 0) {
      console.log('No expired bookings found')
      return new Response(
        JSON.stringify({ 
          message: 'No expired bookings found',
          checked: expiredBookings?.length || 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update expired bookings to completed status
    const { error: updateBookingsError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .in('id', expiredBookingIds)

    if (updateBookingsError) {
      console.error('Error updating bookings:', updateBookingsError)
      throw updateBookingsError
    }

    // Update room status to available for rooms with expired bookings
    // Only if they don't have another active booking
    for (const roomId of roomsToUpdate) {
      // Check if there's another active booking for this room
      const { data: activeBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', roomId)
        .in('status', ['confirmed', 'pending'])
        .gte('booking_date', currentDate)
        .limit(1)

      // If no active bookings, set room to available
      if (!activeBookings || activeBookings.length === 0) {
        const { error: roomUpdateError } = await supabase
          .from('rooms')
          .update({ 
            status: 'available',
            current_session_start: null
          })
          .eq('id', roomId)
          .eq('status', 'occupied') // Only update if currently occupied

        if (roomUpdateError) {
          console.error(`Error updating room ${roomId}:`, roomUpdateError)
        } else {
          console.log(`Room ${roomId} set to available`)
        }
      }
    }

    console.log(`Updated ${expiredBookingIds.length} expired bookings`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Updated ${expiredBookingIds.length} expired bookings`,
        expiredBookings: expiredBookingIds.length,
        roomsUpdated: roomsToUpdate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in update-room-status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
