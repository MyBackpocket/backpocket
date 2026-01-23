import { type Theme, useTheme } from "../lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const themes: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-1">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`flex items-center justify-center rounded-[var(--radius-sm)] px-2.5 py-2 transition-all ${
            theme === value
              ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          title={label}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
