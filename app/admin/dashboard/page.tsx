"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Trash2, Edit2, LogOut, Plus, Search } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      alert("Produk berhasil dihapus");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Gagal menghapus produk");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                BC
              </div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Kelola Produk</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Total: {products.length} produk
              </p>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Tambah Produk
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="search"
              placeholder="Cari produk atau penjual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400">
              Tidak ada produk ditemukan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Penjual
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {product.condition === "baru" ? "Baru" : "Bekas"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{product.seller_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {product.seller_student_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-cyan-600 dark:text-cyan-400">
                        Rp{product.price.toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {product.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors">
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        {deleteConfirm === product.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
