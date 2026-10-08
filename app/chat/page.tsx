'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_message_at: string | null
  buyer: {
    id: string
    name: string
    student_id: string
  }
  seller: {
    id: string
    name: string
    student_id: string
  }
  product: {
    id: string
    title: string
    images: string[]
  }
}

export default function ChatListPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (!response.ok || !data.user) {
        router.push('/login')
        return
      }
      
      setUser(data.user)
      fetchConversations()
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Pesan Saya</h1>

          {conversations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg p-8 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h2 className="text-xl font-semibold mb-2">Belum ada percakapan</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Mulai chat dengan penjual dari halaman produk
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Lihat Produk
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const otherUser = user && conv.buyer.student_id === user.studentId ? conv.seller : conv.buyer
                const isBuyer = user && conv.buyer.student_id === user.studentId
                
                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className="block bg-white dark:bg-slate-900 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={conv.product.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={conv.product.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate">
                          {conv.product.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {isBuyer ? 'Penjual' : 'Pembeli'}: {otherUser.name}
                        </p>
                        {conv.last_message && (
                          <p className="text-sm text-slate-500 truncate">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                      {conv.last_message_at && (
                        <div className="text-xs text-slate-400">
                          {new Date(conv.last_message_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
