"use client"

import { useTheme } from "./providers/ThemeProvider"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { setTheme, isDark } = useTheme()

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-10 w-10 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </button>
  )
}
