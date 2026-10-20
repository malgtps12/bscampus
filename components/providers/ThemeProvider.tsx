"use client"

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  ReactNode,
} from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const THEME_STORAGE_KEY = "theme"
const THEME_CHANGE_EVENT = "bscampus:theme-change"
const MEDIA_QUERY_DARK = "(prefers-color-scheme: dark)"

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

/**
 * Sinkron tema antar-tab & tab yang sama tanpa setState di dalam useEffect
 * (pakai useSyncExternalStore - aman untuk hydration).
 */
function subscribeTheme(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) callback()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
  }
}

function getThemeSnapshot(): Theme {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(saved) ? saved : "system"
}

function getThemeServerSnapshot(): Theme {
  return "system"
}

function subscribeSystemDark(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(MEDIA_QUERY_DARK)
  mediaQuery.addEventListener("change", callback)
  return () => mediaQuery.removeEventListener("change", callback)
}

function getSystemDarkSnapshot(): boolean {
  return window.matchMedia(MEDIA_QUERY_DARK).matches
}

function getSystemDarkServerSnapshot(): boolean {
  return false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  )
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  )

  const isDark = theme === "dark" || (theme === "system" && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
