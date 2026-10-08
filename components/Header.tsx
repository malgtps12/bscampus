import Link from "next/link";
import { ShoppingCart, Plus, Search } from "lucide-react";
import { AuthHeader } from "./AuthHeader";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                BC
              </div>
              <span className="hidden sm:inline">BSCampus</span>
            </Link>
          </div>

          <div className="flex flex-1 max-w-xs items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Cari produk..."
              className="flex-1 bg-transparent py-2 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sell"
              className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-shadow"
            >
              <Plus className="h-4 w-4" />
              Jual
            </Link>
            <button className="h-10 w-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <AuthHeader />
          </div>
        </div>
      </div>
    </header>
  );
}
