import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, Handshake } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 dark:from-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              Marketplace Kampus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
                Politeknik Negeri Lhokseumawe
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              Platform jual beli produk mahasiswa terpercaya di kampus Politeknik Negeri Lhokseumawe. Beli barang bekas, buku, elektronik, dan kebutuhan kampus lainnya dengan harga terbaik.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                Jelajahi Produk
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-slate-300 bg-white px-8 text-slate-900 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Ingin Menjual?
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-3xl opacity-20" />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
                  <GraduationCap className="h-10 w-10 text-blue-500 mb-4" />
                  <h3 className="font-semibold text-lg">Untuk Mahasiswa</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Jual barang-barangmu setelah lulus atau cari buku dan perlengkapan kampus
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
                  <ShieldCheck className="h-10 w-10 text-green-500 mb-4" />
                  <h3 className="font-semibold text-lg">Terpercaya</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Sistem transaksi yang aman dan terpercaya antar mahasiswa
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
                  <Handshake className="h-10 w-10 text-cyan-500 mb-4" />
                  <h3 className="font-semibold text-lg">Komunitas Kampus</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Connect dengan sesama mahasiswa Polinema dan bangun jaringan
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white mb-4">
                    <span className="font-bold">P</span>
                  </div>
                  <h3 className="font-semibold text-lg">Berkualitas</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Review dan rating dari mahasiswa untuk kualitas terjamin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
