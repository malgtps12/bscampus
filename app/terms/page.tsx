import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">Syarat & Ketentuan</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-10">Terakhir diperbarui: 5 Oktober 2026</p>
          <div className="space-y-8 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Definisi</h2>
              <p>BSCampus (&quot;Platform&quot;) adalah marketplace digital yang dikelola untuk memfasilitasi transaksi jual beli produk antar mahasiswa Politeknik Negeri Lhokseumawe. &quot;Pengguna&quot; adalah setiap individu yang mengakses atau menggunakan Platform. &quot;Penjual&quot; adalah Pengguna yang menawarkan produk untuk dijual. &quot;Pembeli&quot; adalah Pengguna yang membeli produk.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">2. Kelayakan Pengguna</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Pengguna harus merupakan mahasiswa aktif, alumni, dosen, atau staf Politeknik Negeri Lhokseumawe.</li>
                <li>Pengguna wajib memberikan data identitas yang valid seperti nama lengkap, NIM/NIDN, dan nomor telepon yang dapat dihubungi.</li>
                <li>Pengguna di bawah umur harus mendapat persetujuan orang tua atau wali.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">3. Kewajiban Penjual</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Menyediakan deskripsi produk yang jujur dan akurat termasuk kondisi barang (baru/bekas), kekurangan, dan kelengkapan.</li>
                <li>Mengunggah foto produk asli, bukan foto dari internet atau milik pihak lain.</li>
                <li>Dilarang menjual barang ilegal, barang curian, obat-obatan terlarang, senjata, dan produk yang melanggar hukum.</li>
                <li>Harga yang tercantum adalah harga final dalam Rupiah (IDR) kecuali disepakati lain oleh kedua pihak.</li>
                <li>Penjual wajib responsif terhadap pertanyaan calon pembeli dalam waktu maksimal 1x24 jam.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">4. Kewajiban Pembeli</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Memeriksa kondisi barang secara langsung sebelum melakukan pembayaran (disarankan COD di area kampus).</li>
                <li>Pembayaran dianggap sah setelah diterima penjual; BSCampus tidak bertanggung jawab atas sengketa pembayaran di luar platform.</li>
                <li>Dilarang melakukan penipuan, PHP (pemberi harapan palsu), atau spam kepada penjual.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">5. Transaksi & Pembayaran</h2>
              <p>BSCampus bertindak sebagai platform perantara dan tidak memungut komisi pada tahap awal. Transaksi dilakukan langsung antara pembeli dan penjual melalui metode yang disepakati (tunai, transfer bank, e-wallet). Pengguna disarankan melakukan transaksi di tempat aman di lingkungan kampus.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">6. Larangan</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Mengunggah konten yang mengandung SARA, pornografi, ujaran kebencian, atau kekerasan.</li>
                <li>Melakukan penipuan, pemalsuan identitas, atau manipulasi harga.</li>
                <li>Menyalahgunakan data pribadi pengguna lain.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">7. Sanksi</h2>
              <p>Pelanggaran terhadap syarat dan ketentuan ini dapat dikenakan sanksi berupa peringatan, penangguhan akun sementara, hingga pemblokiran permanen serta pelaporan ke pihak kampus atau berwenang bila diperlukan.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">8. Perubahan Ketentuan</h2>
              <p>BSCampus berhak mengubah syarat dan ketentuan sewaktu-waktu. Perubahan akan diumumkan melalui platform dan berlaku sejak tanggal publikasi.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3">9. Kontak</h2>
              <p>Pertanyaan mengenai syarat dan ketentuan dapat dikirim ke info@bscampus.id atau melalui halaman Hubungi Kami.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
