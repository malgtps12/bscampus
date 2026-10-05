import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">Kebijakan Privasi</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-10">Terakhir diperbarui: 5 Oktober 2026</p>
          <div className="space-y-8 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Pendahuluan</h2>
              <p>BSCampus menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan platform marketplace kami.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">2. Informasi yang Kami Kumpulkan</h2>
              <h3 className="font-semibold mb-2">a) Informasi yang Anda Berikan:</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Data identitas: Nama lengkap, NIM, program studi, email, nomor telepon</li>
                <li>Konten yang Anda unggah: Foto produk, deskripsi produk, harga, dan informasi lainnya</li>
                <li>Komunikasi: Pesan atau percakapan dengan pengguna lain melalui platform</li>
              </ul>
              <h3 className="font-semibold mb-2">b) Informasi yang Dikumpulkan Otomatis:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Data teknis: IP address, browser, perangkat, sistem operasi</li>
                <li>Aktivitas: Halaman yang dikunjungi, produk yang dilihat, waktu akses</li>
                <li>Cookies dan teknologi pelacakan serupa</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">3. Bagaimana Kami Menggunakan Informasi</h2>
              <p className="mb-2">Kami menggunakan informasi Anda untuk:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menyediakan dan memelihara layanan BSCampus</li>
                <li>Memfasilitasi transaksi antara pembeli dan penjual</li>
                <li>Menampilkan produk Anda kepada calon pembeli</li>
                <li>Mengirim notifikasi terkait aktivitas akun Anda</li>
                <li>Meningkatkan pengalaman pengguna dan fitur platform</li>
                <li>Mencegah aktivitas penipuan dan pelanggaran kebijakan</li>
                <li>Mematuhi kewajiban hukum</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">4. Berbagi Informasi</h2>
              <p className="mb-2">Informasi pribadi Anda akan dibagikan dalam kondisi berikut:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dengan Pengguna Lain:</strong> Nama, NIM, nomor telepon, dan produk yang Anda jual akan terlihat oleh pengguna lain yang mengakses listing Anda.</li>
                <li><strong>Dengan Pihak Kampus:</strong> Jika terjadi pelanggaran serius atau sengketa yang memerlukan intervensi pihak kampus.</li>
                <li><strong>Dengan Pihak Berwenang:</strong> Jika diminta oleh hukum atau untuk melindungi hak dan keamanan pengguna.</li>
                <li><strong>Tidak Dengan Pihak Ketiga Komersial:</strong> Kami tidak menjual data Anda kepada pihak ketiga untuk tujuan pemasaran.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">5. Keamanan Data</h2>
              <p>Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda dari akses tidak sah, kehilangan, atau penyalahgunaan. Namun, tidak ada sistem yang 100% aman. Anda juga bertanggung jawab untuk menjaga kerahasiaan akun Anda.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">6. Penyimpanan Data</h2>
              <p>Data Anda akan disimpan selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Anda dapat menghapus akun kapan saja, dan data Anda akan dihapus dalam waktu 30 hari, kecuali jika harus disimpan untuk keperluan hukum.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">7. Hak Anda</h2>
              <p className="mb-2">Anda memiliki hak untuk:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Mengakses dan melihat data pribadi Anda</li>
                <li>Mengubah atau memperbarui informasi Anda</li>
                <li>Menghapus akun dan data Anda</li>
                <li>Menarik persetujuan penggunaan data</li>
                <li>Mengajukan keluhan terkait pengelolaan data</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">8. Cookies</h2>
              <p>Kami menggunakan cookies untuk meningkatkan pengalaman Anda, mengingat preferensi, dan menganalisis trafik. Anda dapat menolak cookies melalui pengaturan browser, namun beberapa fitur mungkin tidak berfungsi optimal.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">9. Perubahan Kebijakan</h2>
              <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan kami beritahukan melalui email atau notifikasi di platform.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">10. Kontak</h2>
              <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di:</p>
              <p className="mt-2">Email: <a href="mailto:privacy@bscampus.id" className="text-blue-500">privacy@bscampus.id</a></p>
              <p>Atau melalui halaman <a href="/contact" className="text-blue-500">Hubungi Kami</a></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
