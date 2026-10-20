"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          Terjadi kesalahan
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Halaman ini gagal dimuat. Silakan coba lagi atau kembali ke beranda.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Ke Beranda
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-slate-400">Kode: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
