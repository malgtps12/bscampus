'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  campus: string
  createdAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return { user, loading, checkAuth, logout }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()

  return (
    <div>
      {!loading && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {user ? (
              <>
                <div className="text-sm text-gray-700">
                  Logged in as <span className="font-medium">{user.name}</span> ({user.studentId})
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-700">
                  Belum login
                </div>
                <div className="flex gap-3">
                  <a href="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Login
                  </a>
                  <a href="/register" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Register
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
