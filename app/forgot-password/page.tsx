'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim kode')
      }
      
      setSuccess(data.message)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Kode harus 6 digit angka')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak sama')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword, confirmPassword })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal reset password')
      }
      
      setSuccess(data.message)
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      setSuccess(data.message)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BSCampus</h1>
          <p className="text-gray-600">Marketplace Mahasiswa Politeknik Negeri Lhokseumawe</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {step === 1 ? 'Lupa Password' : 'Reset Password'}
          </h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Langkah {step} dari 2</span>
              <span className="text-sm text-blue-600">{step * 50}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${step * 50}%` }}
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Reset Password:</strong> Masukkan email terdaftar. 
                  Kode verifikasi 6 digit akan dikirim ke email Anda (berlaku 10 menit).
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nama@student.pnl.ac.id"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Mengirim kode...' : 'Kirim Kode Verifikasi'}
              </button>
              
              <div className="text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Kode 6 digit telah dikirim ke <strong>{email}</strong>. 
                  Periksa email Anda. Kode berlaku 10 menit.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Verifikasi (6 digit)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  placeholder="123456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru (min. 8 karakter)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Password baru"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ulangi password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Mereset...' : 'Reset Password'}
              </button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Kirim ulang kode
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  Kembali
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
