"use client"

import { Review } from "@/lib/types"
import { Star } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {review.reviewer_name || "Pembeli Anonim"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatRelativeTime(review.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
    </div>
  )
}
