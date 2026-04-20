import { useState, useMemo } from "react";
import { useTaskStore } from "../hooks/useTaskStore";
import { CATEGORIES, WEEKDAYS } from "../types";
import { CheckIcon, XIcon } from "./Icons";

interface Props { store: ReturnType<typeof useTaskStore>; }
type View = "month" | "week";

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar({ store }: Props) {
  const [view, setView] = useState<View>("month");
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayS = store.today;

  const monthDays = useMemo(() => {
    const year = current.getFullYear(), month = current.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [current]);

  const weekDays = useMemo(() => {
    const d = new Date(current);
    d.setDate(d.getDate() - d.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return days;
  }, [current]);

  const navigate = (dir: number) => {
    const d = new Date(current);
    if (view === "month") d.setMonth(d.getMonth() + dir); else d.setDate(d.getDate() + dir * 7);
    setCurrent(d);
  };

  const selectedSummary = selectedDate ? store.getDateSummary(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">カレンダー</h2>
        <div className="flex bg-bg-elevated rounded-xl p-1">
          <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "month" ? "bg-accent text-white" : "text-text-muted"}`}>月</button>
          <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "week" ? "bg-accent text-white" : "text-text-muted"}`}>週</button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-bg-elevated/50 text-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-semibold text-text-primary">{current.getFullYear()}年 {current.getMonth() + 1}月</span>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-bg-elevated/50 text-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 px-4 pt-3 pb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className={`text-center text-[10px] font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-text-muted"}`}>{d}</div>
          ))}
        </div>

        {view === "month" && (
          <div className="grid grid-cols-7 gap-1 px-4 pb-4">
            {monthDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const ds = dateStr(day);
              const summary = store.getDateSummary(ds);
              const isToday = ds === todayS;
              const isSelected = ds === selectedDate;
              const totalActivity = summary.scheduled + summary.completedOneOffCount;
              const totalDone = summary.done + summary.completedOneOffCount;
              const allDone = totalActivity > 0 && totalDone === totalActivity;

              return (
                <button key={ds} onClick={() => setSelectedDate(isSelected ? null : ds)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                    isSelected ? "bg-accent text-white ring-2 ring-accent/50"
                    : isToday ? "bg-accent/20 text-accent font-bold ring-2 ring-accent/40"
                    : "hover:bg-bg-elevated/50 text-text-secondary"
                  }`}>
                  <span>{day.getDate()}</span>
                  {totalActivity > 0 && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${allDone ? "bg-accent-green" : totalDone > 0 ? "bg-accent-amber" : "bg-text-muted/30"}`} />
                      {summary.deadlines > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {view === "week" && (
          <div className="grid grid-cols-7 gap-2 px-4 pb-4">
            {weekDays.map((day) => {
              const ds = dateStr(day);
              const summary = store.getDateSummary(ds);
              const isToday = ds === todayS;
              const isSelected = ds === selectedDate;
              const total = summary.scheduled;
              return (
                <button key={ds} onClick={() => setSelectedDate(isSelected ? null : ds)}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-2 transition-all ${
                    isSelected ? "bg-accent text-white ring-2 ring-accent/50"
                    : isToday ? "bg-accent/10 ring-2 ring-accent/30"
                    : "hover:bg-bg-elevated/50"
                  }`}>
                  <span className={`text-lg font-bold ${isSelected ? "text-white" : isToday ? "text-accent" : "text-text-primary"}`}>{day.getDate()}</span>
                  {total > 0 && (
                    <>
                      <div className={`text-[10px] font-semibold ${isSelected ? "text-white/80" : "text-text-muted"}`}>{summary.done}/{total}</div>
                      <div className="w-full bg-bg-elevated rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(summary.done / total) * 100}%`, backgroundColor: isSelected ? "white" : summary.done === total ? "#10b981" : "#f59e0b" }} />
                      </div>
                    </>
                  )}
                  {summary.completedOneOffCount > 0 && <span className={`text-[10px] ${isSelected ? "text-white/70" : "text-accent-green"}`}>+{summary.completedOneOffCount}完了</span>}
                  {summary.deadlines > 0 && <span className={`text-[10px] font-semibold ${isSelected ? "text-white/80" : "text-accent-red"}`}>期限{summary.deadlines}件</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 選択日の詳細 */}
      {selectedDate && selectedSummary && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{selectedDate.replace(/-/g, "/")}の詳細</h3>
            <button onClick={() => setSelectedDate(null)} className="text-text-muted hover:text-text-primary"><XIcon className="w-4 h-4" /></button>
          </div>
          {selectedSummary.tasks.length === 0 && selectedSummary.deadlineTasks.length === 0 && selectedSummary.completedOneOff.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">この日のタスクはありません</div>
          ) : (
            <ul>
              {/* 定期タスク */}
              {selectedSummary.tasks.map((task, i) => {
                const done = selectedSummary.doneTasks.some((t) => t.id === task.id);
                const cat = CATEGORIES.find((c) => c.id === task.category)!;
                return (
                  <li key={task.id} className={`flex items-center gap-4 px-6 py-3 hover:bg-bg-elevated/30 ${i > 0 ? "border-t border-border-subtle" : ""} ${done ? "opacity-40" : ""}`}>
                    <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${done ? "border-accent-green bg-accent-green text-white" : "border-text-muted/30"}`}>
                      {done && <CheckIcon />}
                    </div>
                    <span className={`flex-1 text-sm ${done ? "line-through" : "text-text-primary"}`}>{task.title}</span>
                    <span className="text-[10px] text-text-muted">定期</span>
                    <span className="text-[10px] px-2 py-1 rounded-lg font-medium border" style={{ backgroundColor: cat.color + "15", color: cat.color, borderColor: cat.color + "25" }}>{cat.label}</span>
                  </li>
                );
              })}
              {/* 完了した単発タスク */}
              {selectedSummary.completedOneOff.map((task, i) => {
                const cat = CATEGORIES.find((c) => c.id === task.category)!;
                return (
                  <li key={task.id} className={`flex items-center gap-4 px-6 py-3 hover:bg-bg-elevated/30 opacity-40 ${(selectedSummary.tasks.length > 0 || i > 0) ? "border-t border-border-subtle" : ""}`}>
                    <div className="w-5 h-5 rounded-lg bg-accent-green/20 text-accent-green flex items-center justify-center flex-shrink-0"><CheckIcon /></div>
                    <span className="flex-1 text-sm line-through">{task.title}</span>
                    <span className="text-[10px] text-text-muted">単発完了</span>
                    <span className="text-[10px] px-2 py-1 rounded-lg font-medium border" style={{ backgroundColor: cat.color + "15", color: cat.color, borderColor: cat.color + "25" }}>{cat.label}</span>
                  </li>
                );
              })}
              {/* 期限タスク */}
              {selectedSummary.deadlineTasks.map((task, i) => {
                const cat = CATEGORIES.find((c) => c.id === task.category)!;
                const offset = selectedSummary.tasks.length + selectedSummary.completedOneOff.length;
                return (
                  <li key={task.id} className={`flex items-center gap-4 px-6 py-3 hover:bg-bg-elevated/30 ${(offset > 0 || i > 0) ? "border-t border-border-subtle" : ""}`}>
                    <div className="w-5 h-5 rounded-lg border-2 border-accent-red/30 bg-accent-red/10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-accent-red">〆</span>
                    </div>
                    <span className="flex-1 text-sm text-text-primary">{task.title}</span>
                    <span className="text-[10px] px-2 py-1 rounded-lg font-medium text-accent-red bg-accent-red/10 border border-accent-red/20">期限</span>
                    <span className="text-[10px] px-2 py-1 rounded-lg font-medium border" style={{ backgroundColor: cat.color + "15", color: cat.color, borderColor: cat.color + "25" }}>{cat.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
