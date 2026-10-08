'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    id: string
    name: string
    student_id: string
  }
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (!response.ok || !data.user) {
        router.push('/login')
        return
      }
      
      setUser(data.user)
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/chat/conversations/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      })

      if (response.ok) {
        setNewMessage('')
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
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
        <div className="mx-auto max-w-4xl h-[calc(100vh-4rem)]">
          <div className="bg-white dark:bg-slate-900 h-full flex flex-col">
            <div className="border-b border-slate-200 dark:border-slate-800 p-4">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali ke Daftar Chat
              </Link>
              <h1 className="text-xl font-bold">Chat dengan Penjual</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Belum ada pesan. Mulai percakapan!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = user && message.sender.student_id === user.studentId
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {message.sender.name}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-slate-200 dark:border-slate-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
