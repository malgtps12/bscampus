import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Pembayaran Diproses - BSCampus",
};

export default async function TransactionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          Pembayaran Sedang Diproses
        </h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Terima kasih! Pembayaran kamu akan dikonfirmasi otomatis oleh
          payment gateway. Status transaksi di halaman admin akan diperbarui
          setelah pembayaran diverifikasi.
        </p>

        {reference && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-4 w-4" />
            Ref: {reference}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/products"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lanjut Belanja
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
