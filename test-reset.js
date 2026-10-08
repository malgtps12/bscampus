// Test script untuk debug reset password
async function testResetPassword(email: string) {
  console.log('=== Testing Reset Password Flow ===')
  console.log('Email:', email)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Email Service:', process.env.EMAIL_SERVICE || 'none')
  console.log('Resend API Key:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET')
  
  const { supabase } = await import('@/lib/supabase')
  
  try {
    // Cek user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single()
    
    if (userError) {
      console.log('User lookup error:', userError)
      return
    }
    
    console.log('User found:', user.email)
    
    // Cek table exists
    const { error: tableError } = await supabase
      .from('password_reset_codes')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.log('Table check error (table mungkin belum ada):', tableError)
    } else {
      console.log('password_reset_codes table exists')
    }
    
    // Test API endpoint
    console.log('\nTesting API endpoint...')
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    const data = await response.json()
    console.log('API Response:', data)
    console.log('HTTP Status:', response.status)
    
  } catch (error) {
    console.log('Test error:', error)
  }
}

// Ganti dengan email user yang valid
testResetPassword('student@example.com')
