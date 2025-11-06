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

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const todayString = today.toISOString().split('T')[0]
    const nextWeekString = nextWeek.toISOString().split('T')[0]

    console.log(`Generating bookings from ${todayString} to ${nextWeekString}`)

    // Get all active recurring bookings
    const { data: recurringBookings, error: fetchError } = await supabase
      .from('recurring_bookings')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', nextWeekString)
      .or(`end_date.is.null,end_date.gte.${todayString}`)

    if (fetchError) {
      console.error('Error fetching recurring bookings:', fetchError)
      throw fetchError
    }

    console.log(`Found ${recurringBookings?.length || 0} active recurring bookings`)

    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const recurring of recurringBookings || []) {
      try {
        // Generate dates for next 7 days
        const datesToGenerate: Date[] = []
        
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
          
          // Skip if before start date or after end date
          if (checkDate < new Date(recurring.start_date)) continue
          if (recurring.end_date && checkDate > new Date(recurring.end_date)) continue

          if (recurring.frequency === 'weekly') {
            // Check if day of week matches
            if (checkDate.getDay() === recurring.day_of_week) {
              datesToGenerate.push(checkDate)
            }
          } else if (recurring.frequency === 'monthly') {
            // Check if day of month matches
            if (checkDate.getDate() === recurring.day_of_month) {
              datesToGenerate.push(checkDate)
            }
          }
        }

        // Create bookings for each date
        for (const date of datesToGenerate) {
          const bookingDate = date.toISOString().split('T')[0]

          // Check if booking already exists
          const { data: existingBooking } = await supabase
            .from('bookings')
            .select('id')
            .eq('room_id', recurring.room_id)
            .eq('booking_date', bookingDate)
            .eq('start_time', recurring.start_time)
            .maybeSingle()

          if (existingBooking) {
            console.log(`Booking already exists for ${bookingDate} at ${recurring.start_time}`)
            skippedCount++
            continue
          }

          // Check room availability
          const { data: isAvailable } = await supabase.rpc('check_room_availability', {
            p_room_id: recurring.room_id,
            p_booking_date: bookingDate,
            p_start_time: recurring.start_time,
            p_end_time: recurring.end_time,
          })

          if (!isAvailable) {
            console.log(`Room not available for ${bookingDate} at ${recurring.start_time}`)
            skippedCount++
            continue
          }

          // Calculate total amount
          const totalAmount = recurring.duration_hours * recurring.hourly_rate

          // Create booking
          const { error: insertError } = await supabase
            .from('bookings')
            .insert({
              room_id: recurring.room_id,
              customer_name: recurring.customer_name,
              customer_phone: recurring.customer_phone,
              customer_email: recurring.customer_email,
              booking_date: bookingDate,
              start_time: recurring.start_time,
              end_time: recurring.end_time,
              duration_hours: recurring.duration_hours,
              total_amount: totalAmount,
              deposit_amount: recurring.deposit_amount,
              notes: `${recurring.notes || ''} (Auto-generated from recurring booking)`,
              status: 'confirmed',
              created_by: recurring.created_by,
            })

          if (insertError) {
            console.error(`Error creating booking for ${bookingDate}:`, insertError)
            errorCount++
          } else {
            console.log(`Created booking for ${bookingDate}`)
            createdCount++
          }
        }
      } catch (error) {
        console.error(`Error processing recurring booking ${recurring.id}:`, error)
        errorCount++
      }
    }

    console.log(`Created ${createdCount} bookings, skipped ${skippedCount}, errors ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        created: createdCount,
        skipped: skippedCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-recurring-bookings:', error)
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
