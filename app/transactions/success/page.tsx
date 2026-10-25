"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

interface PaymentData {
  id: string
  reference: string
  pay_url: string
  qris: string
  amount: number
  expires_at: string
}

type PayStatus = "pending" | "paid" | "expired" | "cancelled" | "unknown"

export default function TransactionSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<PayStatus>("unknown")
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const statusRef = useRef<PayStatus>("unknown")

  const reference = searchParams.get("reference")
  const paymentId = searchParams.get("payment_id")
  const payUrl = searchParams.get("pay_url")

  const applyStatus = useCallback((next: PayStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  // Baca data tagihan dari sessionStorage (disimpan halaman produk sebelum
  // redirect) dan mulai polling status - semuanya via subscription interval,
  // tanpa setState sinkron di body effect.
  useEffect(() => {
    if (!paymentId) return

    const loadAndPoll = () => {
      // Muat data tagihan sekali (untuk render QRIS)
      if (!sessionStorage.getItem("waroengpay:loaded:" + paymentId)) {
        sessionStorage.setItem("waroengpay:loaded:" + paymentId, "1")
        const raw = sessionStorage.getItem("waroengpay:" + paymentId)
        if (raw) {
          try { setPayment(JSON.parse(raw)) } catch { /* abaikan */ }
        }
      }

      // Berhenti polling saat status final
      if (statusRef.current === "paid" || statusRef.current === "expired" || statusRef.current === "cancelled") {
        return
      }

      fetch(`/api/waroengpay/${paymentId}`, { cache: "no-store" })
        .then(res => (res.ok ? res.json() : null))
        .then((data: { status?: PayStatus } | null) => {
          if (data?.status) applyStatus(data.status)
        })
        .catch(() => { /* koneksi gagal - coba lagi di tick berikutnya */ })
    }

    const interval = setInterval(loadAndPoll, 5000)
    loadAndPoll()
    return () => clearInterval(interval)
  }, [paymentId, applyStatus])

  const isFinal = status === "paid" || status === "expired" || status === "cancelled"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          {status === "paid" ? (
            <>
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                Pembayaran Berhasil
              </h1>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                Terima kasih! Pembayaran kamu sudah dikonfirmasi. Penjual akan
                menghubungi kamu untuk pengiriman.
              </p>
            </>
          ) : status === "expired" || status === "cancelled" ? (
            <>
              <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                {status === "expired" ? "Tagihan Kedaluwarsa" : "Pembayaran Dibatalkan"}
              </h1>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                Tagihan QRIS sudah tidak berlaku. Silakan buat pesanan baru jika
                masih ingin membeli.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto mb-4 h-14 w-14 animate-spin text-blue-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                Menunggu Pembayaran
              </h1>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Scan QRIS di bawah atau buka halaman pembayaran. Status akan
                diperbarui otomatis di sini.
              </p>
            </>
          )}

          {payment && !isFinal && payment.qris && (
            <div className="mb-6">
              <div className="mx-auto mb-3 w-fit rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payment.qris)}`}
                  alt="QRIS Pembayaran"
                  width={240}
                  height={240}
                  unoptimized
                  className="h-60 w-60"
                />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Rp{payment.amount?.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-500">
                Termasuk kode unik — bayar persis nominal ini
              </p>
            </div>
          )}

          {payUrl && !isFinal && (
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Buka Halaman Pembayaran
            </a>
          )}

          {reference && (
            <div className="mb-6 mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Clock className="h-4 w-4" />
              Ref: {reference}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/products")}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lanjut Belanja
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Beranda
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
