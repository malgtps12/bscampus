"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4">Hubungi Kami</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Ada pertanyaan atau saran? Tim BSCampus siap membantu Anda
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold mb-6">Kirim Pesan</h2>
              {submitted ? (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                    Pesan Terkirim!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Terima kasih telah menghubungi kami. Kami akan merespons dalam 1x24 jam.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nama Lengkap *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Subjek *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Pesan *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                  >
                    <Send className="h-5 w-5" />
                    Kirim Pesan
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Informasi Kontak</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Alamat</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Jalan Banda Aceh - Medan<br />
                        Kampus Politeknik Negeri Lhokseumawe<br />
                        Akademi Perikanan Lhokseumawe<br />
                        Aceh 24301
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Telepon</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        +62 895-1635-3968<br />
                        Senin - Jumat, 09:00 - 17:00 WIB
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        info@bscampus.id<br />
                        support@bscampus.id
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6">
                <h3 className="font-semibold text-lg mb-3">Jam Operasional</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Senin - Jumat</span>
                    <span className="font-medium">09:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Sabtu</span>
                    <span className="font-medium">09:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Minggu & Libur</span>
                    <span className="font-medium">Tutup</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Butuh Bantuan Cepat?</h3>
                <p className="mb-4 opacity-90">
                  Hubungi kami via WhatsApp untuk respons lebih cepat
                </p>
                <a
                  href="https://wa.me/6289516353968"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100"
                >
                  Chat WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
