import { useState, type FormEvent, type ReactNode } from "react";
import { CATEGORIES, Category, Frequency, Priority, WEEKDAYS, PRIORITY_LABELS, TimeSlot, TIME_SLOTS } from "../types";
import { useTaskStore } from "../hooks/useTaskStore";
import { XIcon, BriefcaseIcon, BookIcon, UserIcon, HeartIcon, TagIcon, CheckIcon } from "./Icons";
import DatePicker from "./DatePicker";

const CATEGORY_ICONS: Record<Category, ReactNode> = {
  work: <BriefcaseIcon className="w-4 h-4" />, skill: <BookIcon className="w-4 h-4" />,
  personal: <UserIcon className="w-4 h-4" />, habit: <HeartIcon className="w-4 h-4" />, other: <TagIcon className="w-4 h-4" />,
};

interface Props { type: "recurring" | "oneoff"; defaultCategory: Category; store: ReturnType<typeof useTaskStore>; onClose: () => void; }

export default function AddTaskModal({ type, defaultCategory, store, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [priority, setPriority] = useState<Priority>(3);
  const [isToday, setIsToday] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [memo, setMemo] = useState("");
  const [duration, setDuration] = useState<string>("");

  const toggleDay = (d: number) => setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const dur = duration.trim() ? Math.max(0, Math.min(999, parseInt(duration, 10) || 0)) : undefined;
    if (type === "recurring") {
      store.addRecurring(title.trim(), category, frequency, timeSlot,
        frequency === "weekday" || frequency === "weekly" || frequency === "biweekly" ? selectedDays : undefined,
        frequency === "monthly" ? monthDay : undefined, memo.trim() || undefined, dur);
    } else {
      store.addOneOff(title.trim(), category, priority, isToday, deadline || undefined, memo.trim() || undefined, dur);
    }
    onClose();
  };

  const cat = CATEGORIES.find((c) => c.id === category)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md border border-border-subtle overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="relative px-6 py-5 border-b border-border-subtle">
          <div className="absolute inset-0 opacity-10" style={{ background: cat.gradient }} />
          <div className="relative flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">{type === "recurring" ? "定期タスク追加" : "単発タスク追加"}</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-elevated/50"><XIcon className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">タスク名</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="何をする？" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border-medium bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${category === c.id ? "text-white border-transparent" : "border-border-subtle text-text-secondary hover:border-border-medium"}`}
                  style={category === c.id ? { background: c.gradient } : {}}>{CATEGORY_ICONS[c.id]}{c.label}</button>
              ))}
            </div>
          </div>

          {type === "recurring" && (<>
            <div>
              <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">時間帯</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((s) => (
                  <button key={s.id} type="button" onClick={() => setTimeSlot(s.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${timeSlot === s.id ? "border-accent bg-accent/15 text-accent" : "border-border-subtle text-text-secondary"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">頻度</label>
              <div className="grid grid-cols-5 gap-2">
                {([{ id: "daily" as Frequency, l: "毎日" }, { id: "weekday" as Frequency, l: "曜日別" }, { id: "weekly" as Frequency, l: "毎週" }, { id: "biweekly" as Frequency, l: "隔週" }, { id: "monthly" as Frequency, l: "毎月" }]).map((f) => (
                  <button key={f.id} type="button" onClick={() => setFrequency(f.id)}
                    className={`px-2 py-2.5 rounded-xl text-xs font-medium border transition-all ${frequency === f.id ? "border-accent bg-accent/15 text-accent" : "border-border-subtle text-text-secondary"}`}>{f.l}</button>
                ))}
              </div>
            </div>
            {(frequency === "weekday" || frequency === "weekly" || frequency === "biweekly") && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">
                  曜日を選択{frequency === "biweekly" ? "（偶数週のみ発動）" : ""}
                </label>
                <div className="flex gap-2">{WEEKDAYS.map((label, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-xl text-xs font-semibold border transition-all ${selectedDays.includes(i) ? "border-accent bg-accent text-white" : "border-border-subtle text-text-secondary"}`}>{label}</button>
                ))}</div>
              </div>
            )}
            {frequency === "monthly" && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">毎月何日？</label>
                <div className="flex items-center gap-3">
                  <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))}
                    className="w-20 px-4 py-2.5 rounded-xl border border-border-medium bg-bg-primary text-sm text-text-primary text-center focus:outline-none focus:border-accent" />
                  <span className="text-sm text-text-muted">日</span>
                </div>
              </div>
            )}
          </>)}

          {type === "oneoff" && (<>
            <div>
              <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">優先度 (1=最優先 〜 5=いつでも)</label>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as Priority[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${priority === p ? "border-accent bg-accent/15 text-accent" : "border-border-subtle text-text-secondary"}`}>
                    {p}<span className="block text-[9px] font-normal mt-0.5 opacity-60">{PRIORITY_LABELS[p]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">期限（任意）</label>
              <DatePicker value={deadline} onChange={setDeadline} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <button type="button" onClick={() => setIsToday(!isToday)}
                className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isToday ? "bg-accent border-accent text-white" : "border-text-muted/30 group-hover:border-accent/50"}`}>
                {isToday && <CheckIcon />}
              </button>
              <span className="text-sm text-text-secondary group-hover:text-text-primary">今日やる</span>
            </label>
          </>)}

          <div>
            <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">所要分（任意・0〜999）</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={999} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="例: 30"
                className="w-24 px-4 py-2.5 rounded-xl border border-border-medium bg-bg-primary text-sm text-text-primary text-center focus:outline-none focus:border-accent" />
              <span className="text-sm text-text-muted">分</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary tracking-wider mb-2">メモ（任意・□/☑でサブタスク進捗）</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: □企画書 □構成 ☑本文" rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border-medium bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none" />
          </div>

          <button type="submit" disabled={!title.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: cat.gradient }}>
            追加する
          </button>
        </form>
      </div>
    </div>
  );
}
