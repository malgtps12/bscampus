"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";
import { Product } from "@/lib/types";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Hero />

      <main className="flex-1 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Produk Terbaru</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Jelajahi berbagai produk dari mahasiswa Politeknik Negeri Lhokseumawe
            </p>
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
            <ProductGrid products={filteredProducts} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
