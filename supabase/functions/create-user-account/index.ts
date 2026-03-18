// Supabase Edge Function: Create User Account (Admin Only)
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

    // Get JWT from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { 
      email, 
      password, 
      role, 
      first_name, 
      last_name, 
      phone,
      department_id,
      specialization,
      license_number 
    } = await req.json()

    // Create auth user
    const { data: newUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    })

    if (authError) throw authError

    // Create user profile
    const { error: profileError } = await supabaseClient
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        role,
        first_name,
        last_name,
        phone
      })

    if (profileError) throw profileError

    // If doctor/nurse, create staff record
    if (['doctor', 'nurse'].includes(role)) {
      const { error: staffError } = await supabaseClient
        .from('staff')
        .insert({
          user_id: newUser.user.id,
          department_id,
          specialization,
          license_number
        })

      if (staffError) throw staffError
    }

    // If patient, create patient record
    if (role === 'patient') {
      const { error: patientError } = await supabaseClient
        .from('patients')
        .insert({
          user_id: newUser.user.id
        })

      if (patientError) throw patientError
    }

    // Log audit
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE_USER',
      table_name: 'users',
      record_id: newUser.user.id,
      new_data: { email, role, first_name, last_name }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        message: 'User created successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
