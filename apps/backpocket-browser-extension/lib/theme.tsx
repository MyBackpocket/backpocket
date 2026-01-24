import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The actual resolved theme (light or dark) based on current settings */
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

interface ThemeProviderProps {
  children: ReactNode;
  /** External theme value (from settings context) */
  externalTheme?: Theme;
  /** Callback when theme changes (to sync with settings) */
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeProvider({ children, externalTheme, onThemeChange }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(externalTheme ?? "system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getSystemTheme);

  // Sync with external theme when it changes
  useEffect(() => {
    if (externalTheme !== undefined && externalTheme !== theme) {
      setThemeState(externalTheme);
      applyTheme(externalTheme);
      setResolvedTheme(externalTheme === "system" ? getSystemTheme() : externalTheme);
    }
  }, [externalTheme, theme]);

  // Apply theme on mount (only runs once)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(theme === "system" ? getSystemTheme() : theme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const systemTheme = getSystemTheme();
        applyTheme("system");
        setResolvedTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    setResolvedTheme(newTheme === "system" ? getSystemTheme() : newTheme);
    // Notify parent if callback provided
    onThemeChange?.(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
