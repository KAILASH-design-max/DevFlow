"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "preferredTheme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme to document root
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (resolved === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
    }
  }, []);

  // Update theme setting and apply
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      // Dispatch custom event so other components in the same window update immediately
      window.dispatchEvent(new CustomEvent("devflow:theme_change", { detail: { theme: newTheme } }));
    } catch {
      // localStorage may be disabled in private browsing
    }

    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [applyTheme]);

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Initial load & system preference listener
  useEffect(() => {
    setMounted(true);
    let stored: Theme = "system";

    try {
      const item = localStorage.getItem(THEME_STORAGE_KEY);
      if (item === "light" || item === "dark" || item === "system") {
        stored = item;
      }
    } catch {
      stored = "system";
    }

    setThemeState(stored);
    const initialResolved = stored === "system" ? getSystemTheme() : stored;
    setResolvedTheme(initialResolved);
    applyTheme(initialResolved);

    // Watch OS preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        const currentStored = localStorage.getItem(THEME_STORAGE_KEY);
        if (currentStored === "system" || !currentStored) {
          const newResolved = e.matches ? "dark" : "light";
          setResolvedTheme(newResolved);
          applyTheme(newResolved);
        }
      } catch {
        const newResolved = e.matches ? "dark" : "light";
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    // Watch storage changes across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const val = e.newValue as Theme;
        if (val === "light" || val === "dark" || val === "system") {
          setThemeState(val);
          const res = val === "system" ? getSystemTheme() : val;
          setResolvedTheme(res);
          applyTheme(res);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Watch custom theme change event in same window
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const val = customEvent.detail?.theme as Theme;
      if (val === "light" || val === "dark" || val === "system") {
        setThemeState(val);
        const res = val === "system" ? getSystemTheme() : val;
        setResolvedTheme(res);
        applyTheme(res);
      }
    };
    window.addEventListener("devflow:theme_change", handleCustomEvent);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("devflow:theme_change", handleCustomEvent);
    };
  }, [applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: mounted ? resolvedTheme : "light",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
