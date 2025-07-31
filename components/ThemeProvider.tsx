"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: "light";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Force theme to 'light'
  const theme: "light" = "light";

  useEffect(() => {
    // Set CSS variables for light mode only
    const root = document.documentElement;
    root.style.setProperty("--background", "#ffffff");
    root.style.setProperty("--foreground", "#111827");
    root.style.setProperty("--primary", "#1e40af");
    root.style.setProperty("--primary-foreground", "#f8fafc");
    root.style.setProperty("--secondary", "#f3f4f6");
    root.style.setProperty("--secondary-foreground", "#111827");
    root.style.setProperty("--border", "#e5e7eb");
    root.style.setProperty("--input", "#e5e7eb");
    root.style.setProperty("--ring", "#1e40af");
    root.style.setProperty("--muted", "#6b7280");
    root.style.setProperty("--muted-foreground", "#374151");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
