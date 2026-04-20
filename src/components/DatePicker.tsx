import { useState, useRef, useEffect } from "react";
import { WEEKDAYS } from "../types";
import { parseShortDate, formatDate } from "../hooks/useTaskStore";

interface Props {
  value: string; // YYYY-MM-DD or ""
  onChange: (v: string) => void;
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value ? formatDate(value) : "");
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const todayS = dateStr(today);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    const parsed = parseShortDate(val);
    if (parsed) {
      onChange(parsed);
      setViewDate(new Date(parsed));
    }
  };

  const selectDay = (d: Date) => {
    const ds = dateStr(d);
    onChange(ds);
    setInput(`${d.getMonth() + 1}/${d.getDate()}`);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setInput("");
    setOpen(false);
  };

  // Calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="4/15 や 12/3（月/日）"
          className="flex-1 px-4 py-2.5 rounded-xl border border-border-medium bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        {value && (
          <button type="button" onClick={clear} className="px-3 py-2 rounded-xl border border-border-subtle text-text-muted hover:text-accent-red text-xs">
            クリア
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-bg-secondary border border-border-subtle rounded-2xl shadow-2xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-bg-elevated/50 text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-text-primary">{year}年 {month + 1}月</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-bg-elevated/50 text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-text-muted"}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const ds = dateStr(day);
              const isToday = ds === todayS;
              const isSelected = ds === value;
              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                    isSelected ? "bg-accent text-white" : isToday ? "bg-accent/20 text-accent font-bold ring-1 ring-accent/40" : "text-text-secondary hover:bg-bg-elevated/50"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
