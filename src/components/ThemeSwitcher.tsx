import { THEMES, ThemeId } from "../types";

interface Props {
  current: ThemeId;
  onChange: (t: ThemeId) => void;
}

export default function ThemeSwitcher({ current, onChange }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
            current === t.id ? "border-white/70 scale-110 ring-1 ring-white/30" : "border-transparent"
          }`}
          style={{ background: t.accentGradient }}
          title={t.label}
        />
      ))}
    </div>
  );
}

/** Apply theme CSS variables to :root */
export function applyTheme(themeId: ThemeId) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--bg-primary", theme.bgPrimary);
  root.style.setProperty("--bg-secondary", theme.bgSecondary);
  root.style.setProperty("--bg-elevated", theme.bgElevated);
  root.style.setProperty("--text-primary", theme.textPrimary);
  root.style.setProperty("--text-secondary", theme.textSecondary);
  root.style.setProperty("--text-muted", theme.textMuted);
  root.style.setProperty("--border-subtle", theme.borderSubtle);
  root.style.setProperty("--border-medium", theme.borderMedium);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-gradient", theme.accentGradient);
  // Update glass-card background based on light/dark
  if (theme.isDark) {
    root.style.setProperty("--card-bg", `linear-gradient(135deg, ${theme.bgSecondary}cc, ${theme.bgSecondary}99)`);
  } else {
    root.style.setProperty("--card-bg", `linear-gradient(135deg, ${theme.bgSecondary}, ${theme.bgSecondary}e6)`);
  }
  document.documentElement.dataset.theme = theme.isDark ? "dark" : "light";
}
