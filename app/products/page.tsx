"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";
import { Search } from "lucide-react";
import { Product } from "@/lib/types";

export const dynamic = 'force-dynamic'

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  let filteredProducts = products;

  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Semua Produk</h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="search"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
              <select className="px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500">
                <option>Terbaru</option>
                <option>Harga: Rendah ke Tinggi</option>
                <option>Harga: Tinggi ke Rendah</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Menampilkan {filteredProducts.length} produk
              </div>
              <ProductGrid products={filteredProducts} />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

