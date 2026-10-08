'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered') === 'true'

  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('user') // 'user' or 'admin'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = userType === 'admin' ? '/api/auth/login' : '/api/auth/user-login'
      
      const payload = userType === 'admin' 
        ? { username: formData.studentId, password: formData.password }
        : { studentId: formData.studentId, password: formData.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        router.push(userType === 'admin' ? '/admin' : '/')
        router.refresh()
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Masuk ke Akun</h2>

          {registered && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
              Registrasi berhasil! Silakan login dengan akun yang telah dibuat.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`flex-1 py-3 font-medium text-center ${userType === 'user' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex-1 py-3 font-medium text-center ${userType === 'admin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {userType === 'user' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIM
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Masukkan NIM Anda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Masukkan password Anda"
                  />
                </div>

                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Lupa password?
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username Admin
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Masukkan username admin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Admin
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Masukkan password admin"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            {userType === 'user' && (
              <p className="text-center text-gray-600 text-sm mt-6">
                Belum punya akun?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  Daftar di sini
                </Link>
              </p>
            )}

            <p className="text-center text-gray-500 text-xs mt-4">
              Dengan login, Anda menyetujui{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                Kebijakan Privasi
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
