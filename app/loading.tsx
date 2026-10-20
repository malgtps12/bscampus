import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 h-8 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          <ProductGridSkeleton count={6} />
        </div>
      </main>
    </div>
  );
}
