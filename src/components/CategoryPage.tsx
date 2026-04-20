import { useState, useCallback, type ReactNode } from "react";
import { CATEGORIES, Category, WEEKDAYS, PRIORITY_LABELS, PRIORITY_STYLES, Priority, TIME_SLOTS, RecurringTask, OneOffTask } from "../types";
import { useTaskStore, formatDate } from "../hooks/useTaskStore";
import { BriefcaseIcon, BookIcon, UserIcon, HeartIcon, TagIcon, CheckIcon, XIcon, PlusIcon, ClockIcon, FireIcon } from "./Icons";

const FREQ_LABEL: Record<string, string> = { daily: "毎日", weekday: "曜日別", weekly: "毎週", monthly: "毎月" };
const TIME_LABEL: Record<string, string> = { allday: "1日", morning: "朝", afternoon: "昼", evening: "夕", night: "夜" };
const TIME_COLOR: Record<string, string> = { allday: "text-sky-400", morning: "text-amber-400", afternoon: "text-yellow-300", evening: "text-orange-400", night: "text-indigo-400" };
const CATEGORY_ICONS: Record<Category, ReactNode> = {
  work: <BriefcaseIcon className="w-6 h-6" />, skill: <BookIcon className="w-6 h-6" />,
  personal: <UserIcon className="w-6 h-6" />, habit: <HeartIcon className="w-6 h-6" />, other: <TagIcon className="w-6 h-6" />,
};

type EditTarget = { type: "recurring"; task: RecurringTask } | { type: "oneoff"; task: OneOffTask };

interface Props { category: Category; store: ReturnType<typeof useTaskStore>; onAdd: (type: "recurring" | "oneoff", cat?: Category) => void; onEdit: (target: EditTarget) => void; }

export default function CategoryPage({ category, store, onAdd, onEdit }: Props) {
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const recurring = store.recurring.filter((t) => t.category === category);
  const allOneOff = store.oneOff.filter((t) => t.category === category);
  const activeOneOff = [...allOneOff.filter((t) => !t.completedAt)].sort((a, b) => a.priority - b.priority);
  const completedOneOff = allOneOff.filter((t) => !!t.completedAt).slice(0, 20);
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const todayRecurring = recurring.filter(store.isScheduledToday);
  const otherRecurring = recurring.filter((t) => !store.isScheduledToday(t));

  // Group today's recurring by time slot
  const recBySlot = TIME_SLOTS.map((slot) => ({
    slot,
    tasks: todayRecurring.filter((t) => (t.timeSlot || "morning") === slot.id),
  })).filter((g) => g.tasks.length > 0);

  const handleDropRec = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = todayRecurring.map((t) => t.id);
    const from = ids.indexOf(dragId); const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1); ids.splice(to, 0, dragId);
    store.reorderRecurring(ids);
    setDragId(null);
  }, [dragId, todayRecurring, store]);

  const handleDropOff = useCallback((targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = activeOneOff.map((t) => t.id);
    const from = ids.indexOf(dragId); const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1); ids.splice(to, 0, dragId);
    store.reorderOneOff(ids);
    setDragId(null);
  }, [dragId, activeOneOff, store]);

  const DragHandle = () => (
    <div className="cursor-grab text-text-muted/30 hover:text-text-muted"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>
  );

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: cat.gradient }}>{CATEGORY_ICONS[cat.id]}</div>
          <div className="flex-1"><h1 className="text-2xl font-bold text-text-primary">{cat.label}</h1><p className="text-text-muted text-sm mt-0.5">定期 {recurring.length}件 / 単発 {activeOneOff.length}件</p></div>
          <div className="flex gap-2">
            <button onClick={() => onAdd("oneoff", category)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2" style={{ background: cat.gradient }}><PlusIcon className="w-4 h-4" />単発タスク</button>
            <button onClick={() => onAdd("recurring", category)} className="px-4 py-2.5 rounded-xl text-sm font-semibold border flex items-center gap-2" style={{ borderColor: cat.color + "40", color: cat.color }}><ClockIcon className="w-4 h-4" />定期タスク</button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 md:hidden">
        <button onClick={() => onAdd("oneoff", category)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: cat.gradient }}><PlusIcon className="w-4 h-4" />単発</button>
        <button onClick={() => onAdd("recurring", category)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2" style={{ borderColor: cat.color + "40", color: cat.color }}><ClockIcon className="w-4 h-4" />定期</button>
      </div>

      {/* 今日の定期（時間帯別） */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /><h2 className="font-semibold text-text-primary text-sm">今日の定期タスク</h2><span className="text-xs text-text-muted ml-auto tabular-nums">{todayRecurring.length}件</span>
        </div>
        {todayRecurring.length === 0 ? <div className="p-10 text-center text-text-muted text-sm">今日のタスクはありません</div> : (
          <div>{recBySlot.map(({ slot, tasks }) => (
            <div key={slot.id}>
              <div className={`px-6 py-2 bg-bg-elevated/30 text-[10px] font-semibold tracking-wider ${TIME_COLOR[slot.id]}`}>{slot.label}</div>
              <ul>{tasks.map((task, i) => {
                const done = store.isRecurringDone(task.id);
                const streak = store.getStreak(task);
                return (
                  <li key={task.id} className={i > 0 ? "border-t border-border-subtle" : ""}
                    draggable onDragStart={() => setDragId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDropRec(task.id)}>
                    <div className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 ${done ? "opacity-40" : ""}`}>
                      <DragHandle />
                      <button onClick={() => store.toggleRecurringCompletion(task.id)}
                        className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? "border-accent-green bg-accent-green text-white" : "border-text-muted/30 hover:border-accent"}`}>
                        {done && <CheckIcon />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm cursor-pointer hover:text-accent transition-colors ${done ? "line-through" : "text-text-primary"}`} onClick={() => onEdit({ type: "recurring", task })}>{task.title}</span>
                          {streak >= 3 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-green/10 text-accent-green font-semibold flex items-center gap-0.5"><FireIcon className="w-3 h-3" />{streak}日</span>}
                        </div>
                        {task.memo && <MemoBtn id={task.id} memo={task.memo} exp={expandedMemo} setExp={setExpandedMemo} />}
                      </div>
                      <span className="text-[10px] text-text-muted font-medium">{FREQ_LABEL[task.frequency]}</span>
                      <button onClick={() => store.deleteRecurring(task.id)} className="text-text-muted/30 hover:text-accent-red transition-colors"><XIcon className="w-4 h-4" /></button>
                    </div>
                  </li>
                );
              })}</ul>
            </div>
          ))}</div>
        )}
      </div>

      {/* その他定期 */}
      {otherRecurring.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle"><h2 className="font-semibold text-text-muted text-sm">その他の定期タスク</h2></div>
          <ul>{otherRecurring.map((task, i) => (
            <li key={task.id} className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 ${i > 0 ? "border-t border-border-subtle" : ""}`}>
              <div className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-sm text-text-secondary cursor-pointer hover:text-accent transition-colors" onClick={() => onEdit({ type: "recurring", task })}>{task.title}</span>
              <span className={`text-[10px] font-medium ${TIME_COLOR[task.timeSlot || "morning"]}`}>{TIME_LABEL[task.timeSlot || "morning"]}</span>
              <span className="text-[10px] text-text-muted font-medium">
                {FREQ_LABEL[task.frequency]}
                {task.frequency === "weekday" && task.days && <span className="ml-1">({task.days.map((d) => WEEKDAYS[d]).join("/")})</span>}
                {task.frequency === "monthly" && task.monthDay && <span className="ml-1">({task.monthDay}日)</span>}
              </span>
              <button onClick={() => store.deleteRecurring(task.id)} className="text-text-muted/30 hover:text-accent-red transition-colors"><XIcon className="w-4 h-4" /></button>
            </li>
          ))}</ul>
        </div>
      )}

      {/* 単発タスク */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between"><h2 className="font-semibold text-text-primary text-sm">単発タスク</h2><span className="text-xs text-text-muted tabular-nums">{activeOneOff.length}件</span></div>
        {activeOneOff.length === 0 ? <div className="p-10 text-center text-text-muted text-sm">単発タスクはありません</div> : (
          <ul>{activeOneOff.map((task, i) => (
            <li key={task.id} className={i > 0 ? "border-t border-border-subtle" : ""}
              draggable onDragStart={() => setDragId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDropOff(task.id)}>
              <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30">
                <DragHandle />
                <button onClick={() => store.completeOneOff(task.id)} className="w-5 h-5 rounded-lg border-2 border-text-muted/30 hover:border-accent-green hover:bg-accent-green hover:text-white flex-shrink-0 flex items-center justify-center transition-all group">
                  <CheckIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-primary cursor-pointer hover:text-accent transition-colors" onClick={() => onEdit({ type: "oneoff", task })}>{task.title}</span>
                  {task.memo && <MemoBtn id={task.id} memo={task.memo} exp={expandedMemo} setExp={setExpandedMemo} />}
                  {task.deadline && <span className="text-[10px] text-text-muted block mt-0.5">期限: {formatDate(task.deadline)}</span>}
                </div>
                <button onClick={() => store.toggleOneOffToday(task.id)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition-all ${task.isToday ? "bg-accent/15 text-accent border-accent/25" : "text-text-muted border-border-subtle hover:text-accent"}`}>
                  {task.isToday ? "今日やる" : "あとで"}
                </button>
                <button onClick={() => { const next = (task.priority % 5 + 1) as Priority; store.updateOneOffPriority(task.id, next); }}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold border cursor-pointer tabular-nums ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</button>
                <button onClick={() => store.deleteOneOff(task.id)} className="text-text-muted/20 hover:text-accent-red transition-colors" title="削除"><XIcon className="w-3.5 h-3.5" /></button>
              </div>
            </li>
          ))}</ul>
        )}
      </div>

      {/* 完了済み */}
      {completedOneOff.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <button onClick={() => setShowCompleted(!showCompleted)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-elevated/30">
            <h2 className="font-semibold text-text-muted text-sm">完了済み ({completedOneOff.length})</h2>
            <svg className={`w-4 h-4 text-text-muted transition-transform ${showCompleted ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showCompleted && (
            <ul className="border-t border-border-subtle">{completedOneOff.map((task, i) => (
              <li key={task.id} className={`flex items-center gap-4 px-6 py-3 opacity-40 ${i > 0 ? "border-t border-border-subtle" : ""}`}>
                <div className="w-5 h-5 rounded-lg bg-accent-green/20 text-accent-green flex items-center justify-center flex-shrink-0"><CheckIcon /></div>
                <span className="flex-1 text-sm line-through">{task.title}</span>
                <span className="text-[10px] text-text-muted">{task.completedAt && formatDate(task.completedAt)}</span>
              </li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  );
}

function MemoBtn({ id, memo, exp, setExp }: { id: string; memo: string; exp: string | null; setExp: (v: string | null) => void }) {
  return <button onClick={() => setExp(exp === id ? null : id)} className="text-xs text-text-muted hover:text-text-secondary mt-0.5 truncate max-w-xs block text-left">{exp === id ? memo : memo.slice(0, 40) + (memo.length > 40 ? "..." : "")}</button>;
}
