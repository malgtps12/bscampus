import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-5xl font-black text-blue-600">404</p>
        <h1 className="mb-2 mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
          Halaman tidak ditemukan
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Halaman yang kamu tuju tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
