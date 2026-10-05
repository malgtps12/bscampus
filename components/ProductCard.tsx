import Link from "next/link";
import { Product } from "@/lib/types";
import { Phone, Calendar } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-cyan-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=400"}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                product.condition === "baru"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }`}
            >
              {product.condition === "baru" ? "Baru" : "Bekas"}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 line-clamp-2 dark:text-slate-100">
            {product.title}
          </h3>
          <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-2">
            {formattedPrice}
          </p>

          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{product.seller_contact}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(product.created_at).toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
