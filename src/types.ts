export type Category = "work" | "skill" | "personal" | "habit" | "other";

export const CATEGORIES: { id: Category; label: string; color: string; gradient: string }[] = [
  { id: "work", label: "仕事", color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6, #6366f1)" },
  { id: "skill", label: "スキル・学習", color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
  { id: "personal", label: "個人の仕事", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { id: "habit", label: "習慣・運動", color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
  { id: "other", label: "その他", color: "#64748b", gradient: "linear-gradient(135deg, #64748b, #94a3b8)" },
];

export type Frequency = "daily" | "weekday" | "weekly" | "biweekly" | "monthly";

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// 1が最高優先、5が最低
export type Priority = 1 | 2 | 3 | 4 | 5;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "最優先",
  2: "高",
  3: "中",
  4: "低",
  5: "いつでも",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  1: "bg-red-500/15 text-red-400 border-red-500/20",
  2: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  3: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  4: "bg-slate-400/15 text-slate-400 border-slate-400/20",
  5: "bg-slate-600/15 text-slate-500 border-slate-600/20",
};

export type TimeSlot = "allday" | "morning" | "afternoon" | "evening" | "night";

export const TIME_SLOTS: { id: TimeSlot; label: string; sortOrder: number }[] = [
  { id: "allday", label: "1日", sortOrder: 0 },
  { id: "morning", label: "朝", sortOrder: 1 },
  { id: "afternoon", label: "昼", sortOrder: 2 },
  { id: "evening", label: "夕", sortOrder: 3 },
  { id: "night", label: "夜", sortOrder: 4 },
];

export interface RecurringTask {
  id: string;
  title: string;
  category: Category;
  frequency: Frequency;
  timeSlot: TimeSlot;
  days?: number[];
  monthDay?: number;
  memo?: string;
  duration?: number; // 所要分
  sortOrder?: number;
  createdAt: string;
}

export interface RecurringCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
}

export interface OneOffTask {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  isToday: boolean;
  deadline?: string; // YYYY-MM-DD
  memo?: string;
  duration?: number; // 所要分
  sortOrder?: number;
  createdAt: string;
  completedAt?: string; // YYYY-MM-DD — set when done, not deleted
}

// カラーテーマ
export type ThemeId = "dark" | "ocean" | "forest" | "violet" | "light" | "cream" | "sky" | "mint";

export interface Theme {
  id: ThemeId;
  label: string;
  isDark: boolean;
  accent: string;
  accentGradient: string;
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderMedium: string;
}

export const THEMES: Theme[] = [
  {
    id: "dark", label: "ダーク", isDark: true,
    accent: "#3b82f6", accentGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    bgPrimary: "#0f172a", bgSecondary: "#1e293b", bgElevated: "#334155",
    textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
    borderSubtle: "rgba(148, 163, 184, 0.1)", borderMedium: "rgba(148, 163, 184, 0.15)",
  },
  {
    id: "ocean", label: "オーシャン", isDark: true,
    accent: "#06b6d4", accentGradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    bgPrimary: "#0c1222", bgSecondary: "#162032", bgElevated: "#1e3048",
    textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
    borderSubtle: "rgba(148, 163, 184, 0.1)", borderMedium: "rgba(148, 163, 184, 0.15)",
  },
  {
    id: "forest", label: "フォレスト", isDark: true,
    accent: "#10b981", accentGradient: "linear-gradient(135deg, #10b981, #059669)",
    bgPrimary: "#0f1a14", bgSecondary: "#1a2e23", bgElevated: "#274033",
    textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
    borderSubtle: "rgba(148, 163, 184, 0.1)", borderMedium: "rgba(148, 163, 184, 0.15)",
  },
  {
    id: "violet", label: "バイオレット", isDark: true,
    accent: "#a78bfa", accentGradient: "linear-gradient(135deg, #a78bfa, #c084fc)",
    bgPrimary: "#13111c", bgSecondary: "#1e1b2e", bgElevated: "#2d2845",
    textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
    borderSubtle: "rgba(148, 163, 184, 0.1)", borderMedium: "rgba(148, 163, 184, 0.15)",
  },
  {
    id: "light", label: "ライト", isDark: false,
    accent: "#3b82f6", accentGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    bgPrimary: "#f8fafc", bgSecondary: "#ffffff", bgElevated: "#f1f5f9",
    textPrimary: "#0f172a", textSecondary: "#475569", textMuted: "#94a3b8",
    borderSubtle: "rgba(15, 23, 42, 0.06)", borderMedium: "rgba(15, 23, 42, 0.12)",
  },
  {
    id: "cream", label: "クリーム", isDark: false,
    accent: "#d97706", accentGradient: "linear-gradient(135deg, #f59e0b, #ea580c)",
    bgPrimary: "#fefaf3", bgSecondary: "#ffffff", bgElevated: "#fef3e2",
    textPrimary: "#292524", textSecondary: "#57534e", textMuted: "#a8a29e",
    borderSubtle: "rgba(120, 53, 15, 0.08)", borderMedium: "rgba(120, 53, 15, 0.15)",
  },
  {
    id: "sky", label: "スカイ", isDark: false,
    accent: "#0284c7", accentGradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    bgPrimary: "#f0f9ff", bgSecondary: "#ffffff", bgElevated: "#e0f2fe",
    textPrimary: "#0c4a6e", textSecondary: "#0369a1", textMuted: "#7dd3fc",
    borderSubtle: "rgba(14, 165, 233, 0.1)", borderMedium: "rgba(14, 165, 233, 0.2)",
  },
  {
    id: "mint", label: "ミント", isDark: false,
    accent: "#059669", accentGradient: "linear-gradient(135deg, #10b981, #34d399)",
    bgPrimary: "#f0fdf4", bgSecondary: "#ffffff", bgElevated: "#dcfce7",
    textPrimary: "#064e3b", textSecondary: "#047857", textMuted: "#86efac",
    borderSubtle: "rgba(5, 150, 105, 0.1)", borderMedium: "rgba(5, 150, 105, 0.2)",
  },
];
