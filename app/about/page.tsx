import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GraduationCap, Target, Users, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Tentang BSCampus
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Platform marketplace resmi mahasiswa Politeknik Negeri Lhokseumawe untuk jual beli produk kampus
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Visi & Misi</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <Target className="h-8 w-8 text-blue-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Visi</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Menjadi platform marketplace terdepan yang menghubungkan seluruh mahasiswa Politeknik Negeri Lhokseumawe dalam ekosistem ekonomi kampus yang berkelanjutan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Target className="h-8 w-8 text-cyan-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Misi</h3>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
                      <li>Menyediakan platform yang aman dan terpercaya untuk transaksi jual beli di lingkungan kampus</li>
                      <li>Mengurangi limbah dengan mendorong reuse barang-barang bekas mahasiswa</li>
                      <li>Membangun komunitas mahasiswa yang saling membantu dan berbagi sumber daya</li>
                      <li>Memfasilitasi mahasiswa mendapatkan barang kebutuhan kampus dengan harga terjangkau</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Sejarah BSCampus</h2>
              <div className="space-y-6 text-slate-600 dark:text-slate-400">
                <p>
                  BSCampus didirikan pada tahun 2026 sebagai inisiatif dari mahasiswa Teknologi Rekayasa Multimedia Politeknik Negeri Lhokseumawe yang melihat kebutuhan akan platform digital untuk transaksi jual beli di lingkungan kampus.
                </p>
                <p>
                  Platform ini dibuat untuk menjawab masalah mahasiswa yang kesulitan menjual barang-barang bekas seperti buku, alat elektronik, dan peralatan kampus saat sudah tidak terpakai, serta mahasiswa baru yang mencari barang dengan harga terjangkau.
                </p>
                <p>
                  Dengan motto <strong>"Kuliah, Jualan, Hemat"</strong>, BSCampus berkomitmen untuk membantu mahasiswa menghemat pengeluaran dan mendapatkan nilai lebih dari barang-barang yang sudah tidak terpakai.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-10 text-center">Tim Kami</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { name: "Muhammad Jamaluddin", desc: "Mahasiswa Teknologi Rekayasa Multimedia 2026" },
                { name: "Muksalmina", desc: "Mahasiswa Teknologi Rekayasa Multimedia 2026" },
                { name: "Raissa Fernanda", desc: "Mahasiswa Teknologi Rekayasa Multimedia 2026" },
                { name: "Faiza Alya Aziza", desc: "Mahasiswa Teknologi Rekayasa Multimedia 2026" },
                { name: "Niswatul Khaira", desc: "Mahasiswa Teknologi Rekayasa Multimedia 2026" },
              ].map((member, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 text-center">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white">
            <h2 className="text-3xl font-bold mb-6">Bergabunglah dengan Komunitas Kami</h2>
            <p className="text-lg mb-6 opacity-90">
              BSCampus bukan hanya marketplace, tapi juga komunitas mahasiswa yang saling mendukung. Dapatkan update terbaru, tips jualan, dan promosi eksklusif.
            </p>
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-6 py-3 rounded-lg text-slate-900"
              />
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100">
                Bergabung
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
