// Quick script to create admin user
// Run with: node create-admin.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mzxubcgsidqaoodwclwe.supabase.co'
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE' // Get from Supabase Dashboard > Settings > API

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'sammyseth260@gmail.com',
      password: 'Admin@123456', // Change this password!
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'sammyseth260@gmail.com',
        role: 'super_admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('Email: sammyseth260@gmail.com')
    console.log('Password: Admin@123456')
    console.log('⚠️  Please change the password after first login!')

  } catch (error) {
    console.error('Error:', error)
  }
}

createAdminUser()
