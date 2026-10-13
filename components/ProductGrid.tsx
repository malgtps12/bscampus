"use client"

import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { useEffect, useRef } from "react";

interface ProductGridProps {
  products: Product[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function ProductGrid({ products, onLoadMore, hasMore, loading }: ProductGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [onLoadMore, hasMore, loading]);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">
          Tidak ada produk yang ditemukan
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center items-center py-8">
          {loading && (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          )}
        </div>
      )}
    </>
  );
}
