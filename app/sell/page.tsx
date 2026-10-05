"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { uploadProductImages } from "@/lib/storage";

export default function SellPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "elektronik",
    condition: "bekas",
    sellerName: "",
    studentId: "",
    phone: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      
      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || imageFiles.length === 0) {
      alert("Mohon lengkapi semua data dan upload minimal 1 gambar");
      return;
    }

    setUploading(true);

    try {
      // Upload images to Supabase Storage
      const uploadedUrls = await uploadProductImages(imageFiles);

      // Create product with uploaded image URLs
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseInt(formData.price),
          category: formData.category,
          condition: formData.condition,
          seller_name: formData.sellerName,
          seller_student_id: formData.studentId,
          seller_contact: formData.phone,
          images: uploadedUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      setSubmitted(true);
      setTimeout(() => {
        window.location.href = "/products?refresh=true";
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat memposting produk. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Jual Produkmu</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Bagikan produk Anda dengan sesama mahasiswa Politeknik Negeri
              Lhokseumawe
            </p>
          </div>

          {submitted ? (
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                Produk Anda Berhasil Diposting!
              </h2>
              <p className="mt-2 text-green-700 dark:text-green-300">
                Produk Anda akan segera tampil di halaman marketplace
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold mb-4">Foto Produk</h2>
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="mb-2 font-medium">Unggah Foto Produk</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Maximum 5 foto, format JPG/PNG
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-6 py-2 rounded-lg bg-blue-500 text-white font-medium cursor-pointer hover:bg-blue-600"
                    >
                      Pilih Foto
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Judul Produk *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Contoh: Laptop ASUS VivoBook 15"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Deskripsi Produk *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Jelaskan kondisi produk, fitur, dan alasan penjualan..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Kategori
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="elektronik">Elektronik</option>
                      <option value="buku">Buku & Alat Tulis</option>
                      <option value="furniture">Furniture</option>
                      <option value="fashion">Fashion</option>
                      <option value="olahraga">Olahraga</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Kondisi
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="baru">Baru</option>
                      <option value="bekas">Bekas</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold mb-4">
                  Informasi Penjual
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleChange}
                      placeholder="Nama Anda"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        NIM *
                      </label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        placeholder="Nomor Induk Mahasiswa"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        No. Telepon *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="081234567890"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/"
                  className="flex-1 h-12 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                >
                  Batal
                </Link>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-white"></div>
                  Mengunggah...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Posting Produk
                </>
              )}
            </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
