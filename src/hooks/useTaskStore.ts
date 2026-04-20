import { useState, useEffect, useCallback, useRef } from "react";
import {
  RecurringTask,
  RecurringCompletion,
  OneOffTask,
  Category,
  Frequency,
  Priority,
  ThemeId,
  TimeSlot,
  TIME_SLOTS,
} from "../types";
import { useAuthUser, firebaseEnabled } from "../firebase/auth";
import { subscribeCloudData, saveCloudData } from "../firebase/store";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(dateStr: string) {
  return `${dateStr.slice(5, 7)}/${dateStr.slice(8, 10)}`;
}

export function formatDateFull(dateStr: string) {
  return `${dateStr.slice(0, 4)}/${dateStr.slice(5, 7)}/${dateStr.slice(8, 10)}`;
}

/** "4/15" or "12/3" → YYYY-MM-DD (current year). "2025/4/15" → 2025-04-15 */
export function parseShortDate(input: string): string {
  const parts = input.replace(/[年月日]/g, "/").split("/").filter(Boolean).map(Number);
  const now = new Date();
  if (parts.length === 2) {
    const [m, d] = parts;
    return `${now.getFullYear()}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Check if a recurring task is scheduled on a specific date
export function isScheduledOnDate(task: RecurringTask, date: Date): boolean {
  const dow = date.getDay();
  const dom = date.getDate();
  switch (task.frequency) {
    case "daily":
      return true;
    case "weekday":
      return task.days ? task.days.includes(dow) : false;
    case "weekly":
      return task.days ? task.days.includes(dow) : dow === 1;
    case "monthly":
      return task.monthDay === dom;
    default:
      return false;
  }
}

export function useTaskStore() {
  const user = useAuthUser();
  const [recurring, setRecurring] = useState<RecurringTask[]>(() => load("tm_recurring", []));
  const [completions, setCompletions] = useState<RecurringCompletion[]>(() => load("tm_completions", []));
  const [oneOff, setOneOff] = useState<OneOffTask[]>(() => load("tm_oneoff", []));
  const [theme, setThemeState] = useState<ThemeId>(() => load("tm_theme", "dark"));
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(todayStr());
  const [cloudStatus, setCloudStatus] = useState<"offline" | "syncing" | "synced" | "error">("offline");
  const applyingRemoteRef = useRef(false); // 購読由来の更新フラグ（クラウド書き込みを抑制）
  const cloudReadyRef = useRef(false); // 初回スナップショット受信後に true。これが false の間はクラウドへ書き込まない

  // Auto-update at midnight
  useEffect(() => {
    const check = () => {
      const now = todayStr();
      if (now !== today) setToday(now);
    };
    const id = setInterval(check, 30000); // check every 30s
    return () => clearInterval(id);
  }, [today]);

  useEffect(() => setLoaded(true), []);
  useEffect(() => { if (loaded) save("tm_recurring", recurring); }, [recurring, loaded]);
  useEffect(() => { if (loaded) save("tm_completions", completions); }, [completions, loaded]);
  useEffect(() => { if (loaded) save("tm_oneoff", oneOff); }, [oneOff, loaded]);
  useEffect(() => { if (loaded) save("tm_theme", theme); }, [theme, loaded]);

  // ─────────── ☁️ クラウド同期 ───────────
  // 重要な不変条件:
  //   - 初回Firestoreスナップショットを受信するまでクラウドへ書き込まない。
  //     そうしないと空のローカル状態で既存のクラウドデータを上書きするリスクがある
  //     （別端末ログイン時に起きる典型バグ）。
  useEffect(() => {
    if (!firebaseEnabled || !user || !loaded) {
      setCloudStatus("offline");
      cloudReadyRef.current = false;
      return;
    }
    setCloudStatus("syncing");
    cloudReadyRef.current = false;
    let firstSnapshot = true;

    const unsub = subscribeCloudData(user.uid, (cloud) => {
      if (cloud && (cloud.recurring?.length || cloud.oneOff?.length || cloud.completions?.length)) {
        // クラウドにデータあり → 状態に反映
        applyingRemoteRef.current = true;
        setRecurring(cloud.recurring || []);
        setCompletions(cloud.completions || []);
        setOneOff(cloud.oneOff || []);
        if (cloud.theme) setThemeState(cloud.theme);
        queueMicrotask(() => { applyingRemoteRef.current = false; });
      } else if (firstSnapshot) {
        // 初回スナップショットでクラウドが空 → ローカルにデータあれば一度だけアップロード
        const hasLocalData =
          recurring.length > 0 || oneOff.length > 0 || completions.length > 0;
        if (hasLocalData) {
          saveCloudData(user.uid, { recurring, completions, oneOff, theme });
        }
        // ローカルも空なら何もしない（上書き事故を防ぐ）
      }
      firstSnapshot = false;
      cloudReadyRef.current = true;
      setCloudStatus("synced");
    });

    return () => {
      unsub();
      cloudReadyRef.current = false;
      setCloudStatus("offline");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, loaded]);

  // ログイン中はローカル変更をクラウドへ反映（ただしクラウド準備完了後のみ）
  useEffect(() => {
    if (!firebaseEnabled || !user || !loaded) return;
    if (!cloudReadyRef.current) return; // 初回スナップショット前は書き込まない
    if (applyingRemoteRef.current) return; // 購読からの更新エコーを無視
    saveCloudData(user.uid, { recurring, completions, oneOff, theme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurring, completions, oneOff, theme, user?.uid, loaded]);

  const setTheme = useCallback((t: ThemeId) => setThemeState(t), []);

  // --- Recurring tasks ---
  const addRecurring = useCallback(
    (title: string, category: Category, frequency: Frequency, timeSlot: TimeSlot, days?: number[], monthDay?: number, memo?: string) => {
      setRecurring((prev) => [
        ...prev,
        { id: genId(), title, category, frequency, timeSlot, days, monthDay, memo, createdAt: todayStr() },
      ]);
    },
    []
  );

  const updateRecurring = useCallback((id: string, updates: Partial<Omit<RecurringTask, "id" | "createdAt">>) => {
    setRecurring((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const reorderRecurring = useCallback((ids: string[]) => {
    setRecurring((prev) => {
      const mapped = new Map(prev.map((t) => [t.id, t]));
      const reordered = ids.map((id, i) => {
        const t = mapped.get(id);
        return t ? { ...t, sortOrder: i } : null;
      }).filter(Boolean) as RecurringTask[];
      const rest = prev.filter((t) => !ids.includes(t.id));
      return [...reordered, ...rest];
    });
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setRecurring((prev) => prev.filter((t) => t.id !== id));
    setCompletions((prev) => prev.filter((c) => c.taskId !== id));
  }, []);

  const toggleRecurringCompletion = useCallback((taskId: string, date?: string) => {
    const d = date || todayStr();
    setCompletions((prev) => {
      const exists = prev.find((c) => c.taskId === taskId && c.date === d);
      if (exists) return prev.filter((c) => !(c.taskId === taskId && c.date === d));
      return [...prev, { taskId, date: d }];
    });
  }, []);

  const isRecurringDone = useCallback(
    (taskId: string, date?: string) => {
      const d = date || today;
      return completions.some((c) => c.taskId === taskId && c.date === d);
    },
    [completions, today]
  );

  const isScheduledToday = useCallback((task: RecurringTask) => {
    return isScheduledOnDate(task, new Date());
  }, []);

  // --- One-off tasks ---
  const addOneOff = useCallback(
    (title: string, category: Category, priority: Priority, isToday: boolean, deadline?: string, memo?: string) => {
      setOneOff((prev) => [
        ...prev,
        { id: genId(), title, category, priority, isToday, deadline, memo, createdAt: todayStr() },
      ]);
    },
    []
  );

  const updateOneOff = useCallback((id: string, updates: Partial<Omit<OneOffTask, "id" | "createdAt">>) => {
    setOneOff((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const reorderOneOff = useCallback((ids: string[]) => {
    setOneOff((prev) => {
      const mapped = new Map(prev.map((t) => [t.id, t]));
      const reordered = ids.map((id, i) => {
        const t = mapped.get(id);
        return t ? { ...t, sortOrder: i } : null;
      }).filter(Boolean) as OneOffTask[];
      const rest = prev.filter((t) => !ids.includes(t.id));
      return [...reordered, ...rest];
    });
  }, []);

  // Complete (not delete) — sets completedAt
  const completeOneOff = useCallback((id: string) => {
    setOneOff((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completedAt: t.completedAt ? undefined : todayStr() } : t))
    );
  }, []);

  // Actually remove from storage
  const deleteOneOff = useCallback((id: string) => {
    setOneOff((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleOneOffToday = useCallback((id: string) => {
    setOneOff((prev) => prev.map((t) => (t.id === id ? { ...t, isToday: !t.isToday } : t)));
  }, []);

  const updateOneOffPriority = useCallback((id: string, priority: Priority) => {
    setOneOff((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
  }, []);

  const updateOneOffMemo = useCallback((id: string, memo: string) => {
    setOneOff((prev) => prev.map((t) => (t.id === id ? { ...t, memo } : t)));
  }, []);

  // --- Queries ---
  const timeSlotOrder = (t: RecurringTask) => {
    const slot = TIME_SLOTS.find((s) => s.id === t.timeSlot);
    return slot ? slot.sortOrder : 99;
  };
  const todayRecurring = recurring
    .filter(isScheduledToday)
    .sort((a, b) => {
      const slotDiff = timeSlotOrder(a) - timeSlotOrder(b);
      if (slotDiff !== 0) return slotDiff;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });
  const todayOneOff = oneOff
    .filter((t) => t.isToday && (!t.completedAt || t.completedAt === today))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  // 先のタスク（今日やらない未完了タスク）
  const upcomingOneOff = oneOff
    .filter((t) => !t.isToday && !t.completedAt)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline > b.deadline ? 1 : -1;
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.priority - b.priority;
    });

  const categoryProgress = (cat: Category) => {
    const recTasks = todayRecurring.filter((t) => t.category === cat);
    const offTasks = todayOneOff.filter((t) => t.category === cat);
    const total = recTasks.length + offTasks.length;
    if (total === 0) return null;
    const doneRec = recTasks.filter((t) => isRecurringDone(t.id)).length;
    const doneOff = offTasks.filter((t) => !!t.completedAt).length;
    const done = doneRec + doneOff;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  // --- Streak ---
  const getStreak = useCallback(
    (task: RecurringTask): number => {
      let streak = 0;
      const d = new Date();
      const todayDone = completions.some((c) => c.taskId === task.id && c.date === today);
      if (!todayDone && isScheduledOnDate(task, d)) {
        d.setDate(d.getDate() - 1);
      }
      for (let i = 0; i < 365; i++) {
        if (isScheduledOnDate(task, d)) {
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (completions.some((c) => c.taskId === task.id && c.date === ds)) {
            streak++;
          } else {
            break;
          }
        }
        d.setDate(d.getDate() - 1);
      }
      return streak;
    },
    [completions, today]
  );

  // --- Calendar date summary ---
  const getDateSummary = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr);
      const scheduledRecurring = recurring.filter((t) => isScheduledOnDate(t, d));
      const doneRecurring = scheduledRecurring.filter((t) =>
        completions.some((c) => c.taskId === t.id && c.date === dateStr)
      );
      const deadlineTasks = oneOff.filter((t) => t.deadline === dateStr && !t.completedAt);
      // 完了した単発タスク（その日に完了したもの）
      const completedOneOff = oneOff.filter((t) => t.completedAt === dateStr);
      return {
        scheduled: scheduledRecurring.length,
        done: doneRecurring.length,
        deadlines: deadlineTasks.length,
        completedOneOffCount: completedOneOff.length,
        tasks: scheduledRecurring,
        doneTasks: doneRecurring,
        deadlineTasks,
        completedOneOff,
      };
    },
    [recurring, completions, oneOff]
  );

  const getDeadlineTasks = useCallback(() => {
    return oneOff
      .filter((t) => t.deadline && !t.completedAt)
      .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
      .map((t) => {
        const days = Math.ceil((new Date(t.deadline!).getTime() - new Date(today).getTime()) / 86400000);
        return { ...t, daysLeft: days };
      });
  }, [oneOff, today]);

  // --- Export / Import ---
  const exportData = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      recurring,
      completions,
      oneOff,
      theme,
    };
    return JSON.stringify(data, null, 2);
  }, [recurring, completions, oneOff, theme]);

  const importData = useCallback((jsonStr: string, mode: "replace" | "merge"): { ok: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== "object") throw new Error("不正なファイル形式です");
      const incRec: RecurringTask[] = Array.isArray(data.recurring) ? data.recurring : [];
      const incComp: RecurringCompletion[] = Array.isArray(data.completions) ? data.completions : [];
      const incOff: OneOffTask[] = Array.isArray(data.oneOff) ? data.oneOff : [];

      if (mode === "replace") {
        setRecurring(incRec);
        setCompletions(incComp);
        setOneOff(incOff);
        if (data.theme) setThemeState(data.theme);
      } else {
        // merge: 既存IDと重複しないものだけ追加
        setRecurring((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          return [...prev, ...incRec.filter((t) => !ids.has(t.id))];
        });
        setOneOff((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          return [...prev, ...incOff.filter((t) => !ids.has(t.id))];
        });
        setCompletions((prev) => {
          const key = (c: RecurringCompletion) => `${c.taskId}-${c.date}`;
          const keys = new Set(prev.map(key));
          return [...prev, ...incComp.filter((c) => !keys.has(key(c)))];
        });
      }
      return { ok: true, message: `インポート完了: 定期${incRec.length}件 / 単発${incOff.length}件 / 完了履歴${incComp.length}件` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "インポートに失敗しました" };
    }
  }, []);

  // Clean old completions (keep 90 days)
  useEffect(() => {
    if (!loaded) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.date >= cutoffStr);
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [loaded]);

  return {
    loaded,
    today,
    theme,
    setTheme,
    user,
    cloudStatus,
    cloudEnabled: firebaseEnabled,
    recurring,
    completions,
    oneOff,
    addRecurring,
    updateRecurring,
    reorderRecurring,
    deleteRecurring,
    toggleRecurringCompletion,
    isRecurringDone,
    isScheduledToday,
    addOneOff,
    updateOneOff,
    reorderOneOff,
    completeOneOff,
    deleteOneOff,
    toggleOneOffToday,
    updateOneOffPriority,
    updateOneOffMemo,
    todayRecurring,
    todayOneOff,
    upcomingOneOff,
    categoryProgress,
    getStreak,
    getDateSummary,
    getDeadlineTasks,
    exportData,
    importData,
  };
}
