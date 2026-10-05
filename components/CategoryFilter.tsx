import { categories } from "@/lib/mockData";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === category.id
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
