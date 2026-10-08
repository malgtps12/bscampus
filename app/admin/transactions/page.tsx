'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Search, Filter, CheckCircle, XCircle, Clock, Box, DollarSign } from 'lucide-react'

interface Transaction {
  id: string
  product_id: string
  product_title: string
  seller_id: string
  seller_name: string
  seller_student_id: string
  buyer_name?: string
  price: number
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'transferred'
  payment_method?: string
  paid_at?: string
  transferred_at?: string
  notes?: string
  created_at: string
  users: {
    id: string
    name: string
    email: string
    phone: string
    student_id: string
    bank_name?: string
    account_number?: string
    account_holder_name?: string
    ewallet_type?: string
    ewallet_number?: string
  }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  transferred: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
}

const statusLabels = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  transferred: 'Ditransfer'
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [transferring, setTransferring] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; notes: string } | null>(null)
  const [transferModal, setTransferModal] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin')
          return
        }
        throw new Error(data.error)
      }

      setTransactions(data.data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, status: newStatus })
      })

      if (response.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleTransfer = async (transactionId: string) => {
    setTransferring(transactionId)
    
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status: 'transferred', notes: `Transfer via admin - ${new Date().toLocaleDateString('id-ID')}` })
      })

      if (response.ok) {
        fetchTransactions()
        setTransferModal(null)
        alert('Saldo berhasil ditransfer ke penjual!')
      }
    } catch (error) {
      console.error('Error transferring:', error)
    } finally {
      setTransferring(null)
    }
  }

  const handleSaveNote = async (transactionId: string) => {
    if (!noteModal) return
    
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, notes: noteModal.notes })
      })

      if (response.ok) {
        setNoteModal(null)
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.seller_student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || t.status === filter

    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'paid': return <DollarSign className="w-4 h-4" />
      case 'shipped': return <Box className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'transferred': return <DollarSign className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              BC
            </div>
            <h1 className="text-2xl font-bold">Transaksi</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Total: {transactions.length} transaksi
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk, penjual, atau pembeli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'pending', label: 'Menunggu' },
                { value: 'confirmed', label: 'Dikonfirmasi' },
                { value: 'paid', label: 'Dibayar' },
                { value: 'transferred', label: 'Ditransfer' }
              ].map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === filterOption.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian' : 'Belum ada transaksi'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                          {transaction.product_title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          ID: {transaction.product_id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusColors[transaction.status]}`}>
                        {getStatusIcon(transaction.status)}
                        {statusLabels[transaction.status] || transaction.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="block text-xs text-slate-500">Penjual</span>
                        <span className="font-medium">{transaction.seller_name}</span>
                        <span className="ml-2 text-xs">({transaction.seller_student_id})</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Pembeli</span>
                        <span className="font-medium">{transaction.buyer_name || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Harga</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Rp{transaction.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Metode</span>
                        <span>{transaction.payment_method || '-'}</span>
                      </div>
                      {transaction.paid_at && (
                        <div>
                          <span className="block text-xs text-slate-500">Tgl. Bayar</span>
                          <span>{new Date(transaction.paid_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seller Payment Info */}
                  <div className="lg:w-72">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        Info Pembayaran Penjual
                      </h4>
                      
                      {transaction.users ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="block text-xs text-slate-500">Nama</span>
                            <span className="font-medium">{transaction.users.name}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-500">Email</span>
                            <span className="font-medium">{transaction.users.email}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-500">Telepon</span>
                            <span>{transaction.users.phone}</span>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-500">Metode Transfer</span>
                            </div>
                            
                            {transaction.users.bank_name ? (
                              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                <div className="mb-1"><span className="text-slate-500">Bank:</span> {transaction.users.bank_name}</div>
                                <div className="mb-1"><span className="text-slate-500">No Rek:</span> {transaction.users.account_number}</div>
                                <div><span className="text-slate-500">Nama:</span> {transaction.users.account_holder_name}</div>
                              </div>
                            ) : transaction.users.ewallet_type ? (
                              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                <div className="mb-1"><span className="text-slate-500">E-Wallet:</span> {transaction.users.ewallet_type}</div>
                                <div><span className="text-slate-500">No:</span> {transaction.users.ewallet_number}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-red-500">
                                Belum ada info pembayaran
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Info penjual tidak tersedia
                        </div>
                      )}
                    </div>

                    {/* Transfer Button */}
                    {transaction.status !== 'transferred' && (
                      <button
                        onClick={() => setTransferModal(transaction.id)}
                        disabled={transferring === transaction.id}
                        className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {transferring === transaction.id ? 'Men transfer...' : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            Transfer Saldo ke Penjual
                          </>
                        )}
                      </button>
                    )}

                    {transaction.status === 'transferred' && transaction.transferred_at && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-400 text-center">
                          Saldo sudah ditransfer pada {new Date(transaction.transferred_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {transaction.notes && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Catatan:</p>
                        <p className="text-sm text-amber-800 dark:text-amber-300">{transaction.notes}</p>
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => setNoteModal({ id: transaction.id, notes: transaction.notes || '' })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {transaction.notes ? 'Edit catatan' : 'Tambah catatan'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Konfirmasi Transfer</h3>
            <p className="mb-4 text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin mentransfer saldo ke penjual?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTransferModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => handleTransfer(transferModal)}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Ya, Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Catatan Transaksi</h3>
            <textarea
              value={noteModal.notes}
              onChange={(e) => setNoteModal({ ...noteModal, notes: e.target.value })}
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg mb-4 h-32 bg-white dark:bg-slate-800"
              placeholder="Tambahkan catatan tentang transaksi ini..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setNoteModal(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveNote(noteModal.id)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
