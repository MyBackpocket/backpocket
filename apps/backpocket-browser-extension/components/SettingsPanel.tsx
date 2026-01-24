/**
 * Settings Panel
 *
 * Displays extension settings with sync to account toggle.
 */

import type { SaveVisibility, Theme } from "../lib/settings";
import { useSettings } from "../lib/settings-context";
import { ChevronLeftIcon, MonitorIcon, MoonIcon, SunIcon } from "./Icons";

interface SettingsPanelProps {
  onBack: () => void;
}

const visibilityOptions: { value: SaveVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

const themeOptions: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { settings, updateSetting, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            aria-label="Back"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Settings</h1>
        </header>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          aria-label="Back"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Settings</h1>
      </header>

      {/* Settings Content */}
      <div className="flex flex-col gap-5">
        {/* Default Save Visibility */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="visibility-select"
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            Default Save Visibility
          </label>
          <select
            id="visibility-select"
            value={settings.defaultSaveVisibility}
            onChange={(e) =>
              updateSetting("defaultSaveVisibility", e.target.value as SaveVisibility)
            }
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent)] focus:outline-none"
          >
            {visibilityOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Theme</span>
          <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--bg-secondary)] p-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSetting("theme", value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-all ${
                  settings.theme === value
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
                aria-pressed={settings.theme === value}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[var(--border)]" />

        {/* Sync to Account Toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">Sync to Account</span>
            <span className="text-xs text-[var(--text-muted)]">
              Changes sync to your account settings on backpocket.my
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.syncToAccount}
            onClick={() => updateSetting("syncToAccount", !settings.syncToAccount)}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              settings.syncToAccount ? "bg-[var(--accent)]" : "bg-[var(--bg-muted)]"
            }`}
          >
            <span
              className={`absolute size-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.syncToAccount ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
