// Supabase Edge Function: Get Available Appointment Slots
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const doctorId = url.searchParams.get('doctor_id')
    const date = url.searchParams.get('date')

    if (!doctorId || !date) {
      return new Response(
        JSON.stringify({ error: 'doctor_id and date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get doctor's working hours
    const { data: staff } = await supabaseClient
      .from('staff')
      .select('available_from, available_to')
      .eq('id', doctorId)
      .single()

    if (!staff) {
      return new Response(
        JSON.stringify({ error: 'Doctor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing appointments for the date
    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select('appointment_time, duration_minutes')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed', 'checked_in'])

    // Generate time slots (30-minute intervals)
    const slots = []
    const startHour = parseInt(staff.available_from.split(':')[0])
    const endHour = parseInt(staff.available_to.split(':')[0])

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
        
        // Check if slot is booked
        const isBooked = appointments?.some(apt => apt.appointment_time === timeStr)
        
        slots.push({
          time: timeStr,
          available: !isBooked
        })
      }
    }

    return new Response(
      JSON.stringify(slots),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
