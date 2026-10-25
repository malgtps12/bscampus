"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Product, Review } from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  Calendar,
  CheckCircle,
  MessageCircle,
  Star,
} from "lucide-react";

interface ProductUser {
  id: string;
  name: string;
  studentId: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProductUser | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  const handleChatPenjual = async () => {
    if (!user) {
      router.push("/login?redirect=/products/" + params.id);
      return;
    }

    if (!product) return;

    setCreatingChat(true);
    try {
      const { data: seller } = await (await fetch(`/api/users/by-student-id/${product.seller_student_id}`)).json();
      
      if (!seller) {
        alert("Penjual tidak ditemukan");
        return;
      }

      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sellerId: seller.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/chat/${data.id}`);
      } else {
        alert(data.error || "Gagal membuat percakapan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setCreatingChat(false);
    }
  };

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

  const fetchWishlistStatus = async () => {
    try {
      const response = await fetch("/api/wishlist");
      if (!response.ok) return; // belum login - status wishlist hanya pelengkap
      const rows: Array<{ id: string; product_id: string }> = await response.json();
      const item = Array.isArray(rows)
        ? rows.find((row) => row.product_id === params.id)
        : undefined;
      if (item) {
        setSaved(true);
        setWishlistId(item.id);
      }
    } catch {
      // abaikan - kegagalan memuat status wishlist tidak kritis
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?product_id=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push("/login?redirect=/products/" + params.id);
      return;
    }

    try {
      if (saved && wishlistId) {
        const response = await fetch(`/api/wishlist?id=${wishlistId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setSaved(false);
          setWishlistId(null);
        } else {
          alert("Gagal menghapus dari wishlist");
        }
      } else {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: params.id }),
        });
        const data = await response.json();
        if (response.ok) {
          setSaved(true);
          setWishlistId(data.id);
        } else if (response.status === 400) {
          // Sudah ada di wishlist - muat ulang untuk mendapatkan ID barisnya
          await fetchWishlistStatus();
        } else {
          alert(data.error || "Gagal menambahkan ke wishlist");
        }
      }
    } catch {
      alert("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleBeliSekarang = async () => {
    if (!user) {
      router.push("/login?redirect=/products/" + params.id);
      return;
    }
    if (!product) return;

    setBuying(true);
    try {
      // Harga tidak dikirim - server mengambilnya dari database
      const response = await fetch("/api/waroengpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();

      if (response.ok && data.data?.pay_url) {
        // Simpan data tagihan supaya halaman tunggu bisa menampilkan QRIS
        // dan polling status tanpa round-trip tambahan.
        try {
          sessionStorage.setItem(
            "waroengpay:" + data.data.id,
            JSON.stringify(data.data)
          );
        } catch {
          // sessionStorage penuh/disabled - halaman tunggu tetap jalan via polling
        }
        // Navigasi ke halaman tunggu lokal; QRIS & link bayar
        // ditampilkan di sana.
        router.push(
          `/transactions/success?payment_id=${encodeURIComponent(
            data.data.id
          )}&reference=${encodeURIComponent(
            data.data.reference
          )}&pay_url=${encodeURIComponent(data.data.pay_url)}`
        );
      } else {
        alert(data.error || "Gagal membuat tagihan pembayaran");
      }
    } catch {
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBuying(false);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/products/" + params.id);
      return;
    }
    if (!product) return;

    setSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setReviewComment("");
        // Muat ulang ulasan + rating produk (trigger DB menghitung ulang)
        const [reviewsRes, productRes] = await Promise.all([
          fetch(`/api/reviews?product_id=${product.id}`),
          fetch(`/api/products/${product.id}`),
        ]);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          if (Array.isArray(reviewsData)) setReviews(reviewsData);
        }
        if (productRes.ok) {
          setProduct(await productRes.json());
        }
      } else {
        alert(data.error || "Gagal mengirim ulasan");
      }
    } catch {
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    // Ambil data saat mount - semua setState terjadi setelah await (async)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduct();
    checkAuth();
    fetchWishlistStatus();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
                <Image
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400"}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
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
                    <Image
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400"}
                      alt="Thumbnail"
                      fill
                      sizes="(max-width: 1024px) 33vw, 16vw"
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
                     <button 
                       onClick={handleChatPenjual}
                       disabled={creatingChat}
                       className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <MessageCircle className="h-5 w-5" />
                       {creatingChat ? "Memproses..." : "Chat dengan Penjual"}
                     </button>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleToggleWishlist}
                  aria-pressed={saved}
                  className={`flex-1 h-12 rounded-lg border font-semibold transition-colors ${
                    saved
                      ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {saved ? "♥ Tersimpan" : "♥ Simpan"}
                </button>
                <button
                  onClick={handleBeliSekarang}
                  disabled={buying || product.sold}
                  className="flex-1 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.sold
                    ? "Sudah Terjual"
                    : buying
                      ? "Memproses..."
                      : "Beli Sekarang"}
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

          <div className="mt-12 rounded-xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Ulasan Pembeli</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {(product.rating ?? 0).toFixed(1)}
                </span>
                <span>({product.review_count ?? reviews.length} ulasan)</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada ulasan untuk produk ini.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{review.reviewer_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(review.created_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div
                      className="mb-2 flex gap-0.5"
                      aria-label={`Rating ${review.rating} dari 5`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <p className="font-semibold">Tulis Ulasan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          aria-label={`Beri rating ${star}`}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= reviewRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tulis ulasanmu tentang produk ini (opsional)"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => router.push("/login?redirect=/products/" + params.id)}
                    className="font-semibold text-blue-500 hover:underline"
                  >
                    Masuk
                  </button>{" "}
                  untuk menulis ulasan.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
