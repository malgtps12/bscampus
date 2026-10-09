'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface WebhookLog {
  id: string
  event: string
  payment_id: string
  status: string
  amount: number
  reference: string
  received_at: string
  verified: boolean
  livemode: boolean
  raw_data?: any
}

export default function WebhookMonitorPage() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhook/logs')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchWebhooks, 5000) // Refresh setiap 5 detik
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    }

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: status }
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const getEventBadge = (event: string) => {
    const eventColors: Record<string, string> = {
      'payment.paid': 'bg-green-50 text-green-700 border-green-200',
      'payment.expired': 'bg-gray-50 text-gray-700 border-gray-200',
      'payment.cancelled': 'bg-red-50 text-red-700 border-red-200'
    }

    return (
      <span className={`px-2 py-1 rounded border text-xs font-mono ${eventColors[event] || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
        {event}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Webhook Monitor</h1>
              <p className="text-gray-600 mt-1">Real-time monitoring webhook WaroengPay</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ← Kembali
            </Link>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchWebhooks}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh (5s)</span>
                </label>
              </div>

              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold">{webhooks.length}</span> webhooks
              </div>
            </div>
          </div>
        </div>

        {/* Webhook List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600">Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Webhook</h3>
            <p className="text-gray-600 mb-4">
              Webhook dari WaroengPay akan muncul di sini secara real-time
            </p>
            <div className="text-sm text-gray-500">
              <p>Webhook endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/waroengpay/webhook</code></p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getEventBadge(webhook.event)}
                    {getStatusBadge(webhook.status)}
                    {webhook.livemode ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold">
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-xs font-semibold">
                        TEST
                      </span>
                    )}
                    {webhook.verified ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(webhook.received_at)}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{webhook.payment_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reference</p>
                    <p className="text-sm font-mono text-gray-900">{webhook.reference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(webhook.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Webhook ID</p>
                    <p className="text-xs font-mono text-gray-600">{webhook.id}</p>
                  </div>
                </div>

                {webhook.raw_data && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                      View Raw Data
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 text-xs overflow-x-auto">
                      {JSON.stringify(webhook.raw_data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informasi Webhook</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Webhook otomatis diterima dari WaroengPay saat status pembayaran berubah</li>
            <li>• Event: <code>payment.paid</code>, <code>payment.expired</code>, <code>payment.cancelled</code></li>
            <li>• Webhook diverifikasi dengan HMAC-SHA256 signature</li>
            <li>• Auto-refresh akan memperbarui data setiap 5 detik</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
