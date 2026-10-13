// Debug script untuk cek masalah login
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = 'https://mjpbiktoxqqircxrsfxr.supabase.co'
const supabaseKey = 'sb_publishable_uGrAoFg1LDK2_jogUAUiww_VonkQArH'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLogin() {
  console.log('🔍 Debug Login BSCampus')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Test credentials (ganti dengan yang Anda pakai)
  const testStudentId = '2101011001' // Ganti dengan NIM Anda
  const testPassword = 'password123'  // Ganti dengan password Anda
  
  console.log('\n📋 Testing dengan:')
  console.log('   NIM:', testStudentId)
  console.log('   Password:', testPassword)
  
  try {
    // 1. Cek koneksi database
    console.log('\n1️⃣ Cek koneksi database...')
    const { data: tables, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (dbError) {
      console.error('❌ Database error:', dbError.message)
      return
    }
    console.log('✅ Database terkoneksi')
    
    // 2. Cari user
    console.log('\n2️⃣ Mencari user dengan NIM:', testStudentId)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', testStudentId)
      .single()
    
    if (error) {
      console.error('❌ User tidak ditemukan:', error.message)
      console.log('\n💡 Solusi: Daftar akun baru di /register')
      return
    }
    
    console.log('✅ User ditemukan:')
    console.log('   - ID:', user.id)
    console.log('   - Nama:', user.name)
    console.log('   - Email:', user.email)
    console.log('   - NIM:', user.student_id)
    
    // 3. Cek password
    console.log('\n3️⃣ Verifikasi password...')
    if (!user.password_hash) {
      console.error('❌ Password hash tidak ada di database!')
      return
    }
    
    console.log('   Hash di DB:', user.password_hash.substring(0, 20) + '...')
    
    const isValid = await bcrypt.compare(testPassword, user.password_hash)
    
    if (isValid) {
      console.log('✅ Password BENAR!')
      console.log('\n✅ Login seharusnya BERHASIL!')
      console.log('\n❓ Jika masih gagal di browser:')
      console.log('   1. Clear browser cache')
      console.log('   2. Coba di incognito/private window')
      console.log('   3. Cek console browser untuk error')
    } else {
      console.log('❌ Password SALAH!')
      console.log('\n💡 Solusi:')
      console.log('   1. Pastikan password benar')
      console.log('   2. Reset password di /forgot-password')
      console.log('   3. Atau buat akun baru di /register')
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

debugLogin()
