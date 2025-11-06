import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time + 15 minutes
    const now = new Date()
    const reminderTime = new Date(now.getTime() + 15 * 60000)
    
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    const reminderTimeString = reminderTime.toTimeString().slice(0, 5)

    console.log(`Checking bookings between ${currentTime} and ${reminderTimeString} on ${currentDate}`)

    // Find bookings starting in ~15 minutes that haven't been reminded
    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        customer_name,
        customer_email,
        customer_phone,
        rooms (room_name, room_number)
      `)
      .eq('booking_date', currentDate)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', currentTime)
      .lte('start_time', reminderTimeString)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    console.log(`Found ${upcomingBookings?.length || 0} upcoming bookings`)

    let sentCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const booking of upcomingBookings || []) {
      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from('booking_reminders')
        .select('id')
        .eq('booking_id', booking.id)
        .maybeSingle()

      if (existingReminder) {
        console.log(`Reminder already sent for booking ${booking.id}`)
        skippedCount++
        continue
      }

      // Skip if no email
      if (!booking.customer_email) {
        console.log(`No email for booking ${booking.id}`)
        skippedCount++
        continue
      }

      // Get room info
      const roomInfo = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms
      const roomName = roomInfo?.room_name || 'Room'
      const roomNumber = roomInfo?.room_number || 'N/A'

      try {
        // Send reminder email
        const { error: emailError } = await resend.emails.send({
          from: 'KTV Booking <onboarding@resend.dev>',
          to: [booking.customer_email],
          subject: `Booking Reminder - ${roomName} in 15 minutes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Booking Reminder</h1>
              <p>Hi ${booking.customer_name},</p>
              <p>This is a friendly reminder that your booking is starting soon!</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #555;">Booking Details</h2>
                <p><strong>Room:</strong> ${roomName} (${roomNumber})</p>
                <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
              </div>
              
              <p>Please arrive on time to enjoy your full booking duration.</p>
              <p>If you need to make any changes, please contact us.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #888; font-size: 12px;">You received this email because you have an upcoming booking with us.</p>
            </div>
          `,
        })

        if (emailError) {
          console.error(`Error sending email for booking ${booking.id}:`, emailError)
          errorCount++
          
          // Record failed reminder
          await supabase.from('booking_reminders').insert({
            booking_id: booking.id,
            email_sent: false,
            email_error: emailError.message || 'Unknown error',
          })
        } else {
          console.log(`Reminder sent for booking ${booking.id}`)
          sentCount++
          
          // Record successful reminder
          await supabase.from('booking_reminders').insert({
            booking_id: booking.id,
            email_sent: true,
          })
        }
      } catch (error) {
        console.error(`Exception sending reminder for booking ${booking.id}:`, error)
        errorCount++
      }
    }

    console.log(`Reminders: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
        total: upcomingBookings?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-booking-reminders:', error)
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
