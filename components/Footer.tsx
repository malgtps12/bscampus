import Link from "next/link";
import { MapPin, Building2, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                BC
              </div>
              <span>BSCampus</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Marketplace resmi mahasiswa Politeknik Negeri Lhokseumawe untuk jual beli produk kampus.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-cyan-500">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kategori</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="/products?category=elektronik" className="hover:text-blue-500">
                  Elektronik
                </a>
              </li>
              <li>
                <a href="/products?category=buku" className="hover:text-blue-500">
                  Buku & Alat Tulis
                </a>
              </li>
              <li>
                <a href="/products?category=furniture" className="hover:text-blue-500">
                  Furniture
                </a>
              </li>
              <li>
                <a href="/products?category=fashion" className="hover:text-blue-500">
                  Fashion
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Tentang</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="/about" className="hover:text-blue-500">
                  Tentang BSCampus
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-blue-500">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-blue-500">
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-blue-500">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-500 shrink-0" />
                <span>
                  Jalan. Banda Aceh - Medan<br />
                  Kampus Politeknik Negeri Lhokseumawe<br />
                  Akademi Perikanan Lhokseumawe
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-500 shrink-0" />
                <span>Politeknik Negeri Lhokseumawe</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                <span>info@bscampus.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 dark:border-slate-800">
          <p>© 2026 BSCampus - Marketplace Politeknik Negeri Lhokseumawe</p>
        </div>
      </div>
    </footer>
  );
}
