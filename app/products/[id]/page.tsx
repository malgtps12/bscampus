"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Product } from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) throw new Error("Product not found");
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Produk tidak ditemukan</h1>
            <Link href="/products" className="text-blue-500 hover:underline">
              Kembali ke daftar produk
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali
          </Link>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400"}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                      product.condition === "baru"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {product.condition === "baru" ? "Produk Baru" : "Produk Bekas"}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer hover:opacity-80"
                  >
                    <img
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400"}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {formattedPrice}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold mb-3">Deskripsi Produk</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  {product.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Kategori
                  </p>
                  <p className="font-semibold capitalize">{product.category}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Kondisi
                  </p>
                  <p className="font-semibold capitalize">
                    {product.condition === "baru" ? "Baru" : "Bekas"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Informasi Penjual
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Nama Penjual
                    </p>
                    <p className="font-semibold">{product.seller_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      NIM Mahasiswa
                    </p>
                    <p className="font-semibold">{product.seller_student_id}</p>
                  </div>
                  <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href={`tel:${product.seller_contact}`}
                      className="flex items-center gap-3 rounded-lg bg-white p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Phone className="h-5 w-5 text-blue-500" />
                      <span>{product.seller_contact}</span>
                    </a>
                    <button className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-shadow">
                      Hubungi Penjual
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 h-12 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                  ♥ Simpan
                </button>
                <button className="flex-1 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-shadow">
                  Beli Sekarang
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Diposting pada{" "}
                  {new Date(product.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
