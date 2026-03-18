// Supabase Edge Function: Send Appointment Reminders
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { appointment_id, method } = await req.json()

    // Get appointment details with patient and doctor info
    const { data: appointment } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        patient:patients(
          user:users(first_name, last_name, email, phone)
        ),
        doctor:staff(
          user:users(first_name, last_name)
        ),
        department:departments(name)
      `)
      .eq('id', appointment_id)
      .single()

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const patientName = `${appointment.patient.user.first_name} ${appointment.patient.user.last_name}`
    const doctorName = `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const appointmentTime = appointment.appointment_time

    // Send Email
    if (method === 'email' || method === 'both') {
      // Using SendGrid or similar service
      const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: appointment.patient.user.email }],
            subject: 'Appointment Reminder'
          }],
          from: { email: 'noreply@hospital.com', name: 'Hospital Management System' },
          content: [{
            type: 'text/html',
            value: `
              <h2>Appointment Reminder</h2>
              <p>Dear ${patientName},</p>
              <p>This is a reminder for your upcoming appointment:</p>
              <ul>
                <li><strong>Doctor:</strong> ${doctorName}</li>
                <li><strong>Department:</strong> ${appointment.department.name}</li>
                <li><strong>Date:</strong> ${appointmentDate}</li>
                <li><strong>Time:</strong> ${appointmentTime}</li>
              </ul>
              <p>Please arrive 15 minutes early for check-in.</p>
              <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
            `
          }]
        })
      })
    }

    // Send SMS
    if (method === 'sms' || method === 'both') {
      // Using Twilio
      const smsResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: appointment.patient.user.phone,
            From: Deno.env.get('TWILIO_PHONE_NUMBER') ?? '',
            Body: `Appointment Reminder: ${doctorName} on ${appointmentDate} at ${appointmentTime}. Please arrive 15 mins early.`
          })
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Reminder sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
