"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Returns the appropriate icon component based on the resolved theme.
 * Used to show Sun for light mode and Moon for dark mode.
 */
export function getThemeIcon(resolvedTheme: string | undefined) {
  return resolvedTheme === "dark" ? Moon : Sun;
}

/**
 * Returns the next theme in the cycle: system → light → dark → system
 */
export function getNextTheme(currentTheme: string | undefined): "light" | "dark" | "system" {
  if (currentTheme === "system") return "light";
  if (currentTheme === "light") return "dark";
  return "system";
}

interface ThemeSwitcherProps {
  /** Additional class names */
  className?: string;
}

/**
 * Theme switcher with dropdown menu.
 * Uses resolvedTheme for the icon which updates dynamically when theme changes.
 */
export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/hydration, render a skeleton to prevent mismatch and flash
  if (!mounted) {
    return <div className={cn("h-9 w-9 shrink-0", className)} />;
  }

  const ThemeIcon = getThemeIcon(resolvedTheme);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9 shrink-0", className)}>
          <ThemeIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Floating theme switcher for mobile.
 * Fixed position in bottom-right corner with a pill-shaped button.
 */
export function ThemeSwitcherFloating() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    setTheme(getNextTheme(theme));
  };

  // During SSR/hydration, don't render anything to prevent layout shift
  if (!mounted) {
    return null;
  }

  const ThemeIcon = getThemeIcon(resolvedTheme);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="fixed bottom-4 right-8 z-50 h-12 w-12 rounded-full shadow-lg border-2 bg-background/95 backdrop-blur-sm hover:scale-105 transition-transform sm:hidden"
      title={`Theme: ${theme}`}
    >
      <ThemeIcon className="h-5 w-5" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/**
 * Compact theme switcher that cycles through themes on click.
 * Uses resolvedTheme for the icon which updates dynamically when theme changes.
 */
export function ThemeSwitcherCompact() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    setTheme(getNextTheme(theme));
  };

  // During SSR/hydration, render a skeleton to prevent mismatch and flash
  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const ThemeIcon = getThemeIcon(resolvedTheme);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9"
      title={`Theme: ${theme}`}
    >
      <ThemeIcon className="h-4 w-4" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
