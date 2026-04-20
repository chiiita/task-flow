import { useState, useCallback, type ReactNode } from "react";
import { CATEGORIES, Category, PRIORITY_LABELS, PRIORITY_STYLES, Priority, TIME_SLOTS, RecurringTask, OneOffTask, TimeSlot } from "../types";
import { useTaskStore, formatDate, calcSubtaskProgress } from "../hooks/useTaskStore";
import { BriefcaseIcon, BookIcon, UserIcon, HeartIcon, TagIcon, CheckIcon, FireIcon, ChartIcon, PlusIcon } from "./Icons";

function currentTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 16) return "afternoon";
  if (h < 19) return "evening";
  return "night";
}

const CATEGORY_ICONS: Record<Category, ReactNode> = {
  work: <BriefcaseIcon className="w-5 h-5" />, skill: <BookIcon className="w-5 h-5" />,
  personal: <UserIcon className="w-5 h-5" />, habit: <HeartIcon className="w-5 h-5" />, other: <TagIcon className="w-5 h-5" />,
};

const TIME_LABEL: Record<string, string> = { morning: "朝", afternoon: "昼", evening: "夕", night: "夜" };
const TIME_COLOR: Record<string, string> = { allday: "text-sky-400", morning: "text-amber-400", afternoon: "text-yellow-300", evening: "text-orange-400", night: "text-indigo-400" };

function deadlineColor(d: number) { return d <= 0 ? "bg-red-500/15 text-red-400 border-red-500/20" : d <= 3 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-bg-elevated/60 text-text-muted border-border-subtle"; }
function deadlineLabel(d: number) { return d < 0 ? `${Math.abs(d)}日超過` : d === 0 ? "今日まで" : d === 1 ? "明日まで" : `あと${d}日`; }

type EditTarget = { type: "recurring"; task: RecurringTask } | { type: "oneoff"; task: OneOffTask };

interface Props {
  store: ReturnType<typeof useTaskStore>;
  onNavigate: (page: Category | "calendar") => void;
  onAdd: (type: "recurring" | "oneoff", cat?: Category) => void;
  onEdit: (target: EditTarget) => void;
}

export default function Dashboard({ store, onNavigate, onAdd, onEdit }: Props) {
  const todayRec = store.todayRecurring;
  const todayOff = [...store.todayOneOff].sort((a, b) => a.priority - b.priority);
  const upcoming = store.upcomingOneOff.slice(0, 10);
  const deadlineTasks = store.getDeadlineTasks();
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const totalTasks = todayRec.length + todayOff.length;
  const doneRec = todayRec.filter((t) => store.isRecurringDone(t.id)).length;
  const doneOff = todayOff.filter((t) => !!t.completedAt).length;
  const doneTotal = doneRec + doneOff;
  const overallPercent = totalTasks > 0 ? Math.round((doneTotal / totalTasks) * 100) : 0;

  const topStreaks = store.recurring.map((t) => ({ task: t, streak: store.getStreak(t) })).filter((s) => s.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5);

  // Group recurring by time slot
  const recBySlot = TIME_SLOTS.map((slot) => ({
    slot,
    tasks: todayRec.filter((t) => (t.timeSlot || "morning") === slot.id),
  })).filter((g) => g.tasks.length > 0);

  const handleDrop = useCallback((targetId: string, list: "recurring" | "oneoff") => {
    if (!dragId || dragId === targetId) return;
    if (list === "recurring") {
      const ids = todayRec.map((t) => t.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      store.reorderRecurring(ids);
    } else {
      const ids = todayOff.map((t) => t.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      store.reorderOneOff(ids);
    }
    setDragId(null);
  }, [dragId, todayRec, todayOff, store]);

  // 今すぐセクション用: 現在時間帯 + allday の未完了タスク
  const nowSlot = currentTimeSlot();
  const SLOT_LABEL: Record<TimeSlot, string> = { allday: "1日", morning: "朝", afternoon: "昼", evening: "夕", night: "夜" };
  const nowRecurring = todayRec.filter((t) => !store.isRecurringDone(t.id) && (t.timeSlot === nowSlot || t.timeSlot === "allday"));
  const nowOneOff = todayOff.filter((t) => !t.completedAt);
  const nowTotalMin = [
    ...nowRecurring.map((t) => t.duration || 0),
    ...nowOneOff.map((t) => t.duration || 0),
  ].reduce((a, b) => a + b, 0);

  // 振り返り: 直近7日 / 30日の完了数
  const week = store.getRecentStats(7);
  const month = store.getRecentStats(30);
  const weekTotal = week.reduce((a, b) => a + b.count, 0);
  const monthTotal = month.reduce((a, b) => a + b.count, 0);
  const weekMax = Math.max(...week.map((d) => d.count), 1);
  const monthMax = Math.max(...month.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-text-primary">ダッシュボード</h1>
        <p className="text-text-muted mt-1 text-sm">今日のタスクを一覧で確認</p>
      </div>

      {/* ⚡ 今すぐ */}
      {(nowRecurring.length + nowOneOff.length > 0) && (
        <div className="rounded-2xl p-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent))", backgroundImage: "var(--accent-gradient)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.25 0L3 13h7L9 24l8-13h-7l1-11z"/></svg>
              <h2 className="font-bold text-sm tracking-wider">今すぐ（{SLOT_LABEL[nowSlot]}）</h2>
            </div>
            <span className="text-xs opacity-90 tabular-nums">
              {nowRecurring.length + nowOneOff.length}件{nowTotalMin > 0 ? ` / 合計${nowTotalMin}分` : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {nowRecurring.slice(0, 6).map((t) => {
              const sub = calcSubtaskProgress(t.memo);
              return (
                <div key={t.id} className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <button onClick={() => store.toggleRecurringCompletion(t.id)} className="w-4 h-4 rounded border-2 border-white/60 hover:bg-white/30 flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">🔁 {t.title}</span>
                  {t.duration && <span className="text-[10px] opacity-80 tabular-nums">{t.duration}分</span>}
                  {sub && <span className="text-[10px] opacity-90">({sub.done}/{sub.total})</span>}
                </div>
              );
            })}
            {nowOneOff.slice(0, 6 - nowRecurring.length).map((t) => {
              const sub = calcSubtaskProgress(t.memo);
              return (
                <div key={t.id} className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <button onClick={() => store.completeOneOff(t.id)} className="w-4 h-4 rounded border-2 border-white/60 hover:bg-white/30 flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">📌 {t.title}</span>
                  {t.duration && <span className="text-[10px] opacity-80 tabular-nums">{t.duration}分</span>}
                  {sub && <span className="text-[10px] opacity-90">({sub.done}/{sub.total})</span>}
                </div>
              );
            })}
            {(nowRecurring.length + nowOneOff.length > 6) && (
              <div className="text-[11px] opacity-80 text-center pt-1">… 他 {nowRecurring.length + nowOneOff.length - 6} 件</div>
            )}
          </div>
        </div>
      )}

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass-card rounded-2xl p-6 glow-accent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--accent-gradient)" }}><ChartIcon className="w-5 h-5" /></div>
            <div className="flex-1"><h2 className="font-semibold text-text-primary">今日の進捗</h2><p className="text-xs text-text-muted">{doneTotal}/{totalTasks} 完了</p></div>
            <span className="text-3xl font-bold text-accent tabular-nums">{overallPercent}%</span>
          </div>
          <div className="w-full bg-bg-elevated rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPercent}%`, background: "var(--accent-gradient)" }} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-accent-amber"><FireIcon className="w-5 h-5" /><span className="text-xs font-semibold tracking-wider">今日のタスク</span></div>
          <div className="mt-3"><div className="text-3xl font-bold text-text-primary tabular-nums">{totalTasks}</div><p className="text-xs text-text-muted mt-0.5">定期 {todayRec.length} / 単発 {todayOff.length}</p></div>
        </div>
      </div>

      {/* ストリーク */}
      {topStreaks.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-text-muted tracking-wider mb-3">連続達成中</h3>
          <div className="flex flex-wrap gap-3">
            {topStreaks.map(({ task, streak }) => (<div key={task.id} className="flex items-center gap-2 bg-accent-green/10 text-accent-green rounded-xl px-3 py-2"><FireIcon className="w-4 h-4" /><span className="text-sm font-semibold">{streak}日</span><span className="text-xs text-accent-green/70">{task.title}</span></div>))}
          </div>
        </div>
      )}

      {/* 📊 振り返り */}
      {(weekTotal > 0 || monthTotal > 0) && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-text-muted tracking-wider mb-4">📊 振り返り</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-text-secondary">今週（過去7日）</span>
                <span className="text-xs text-text-muted tabular-nums">{weekTotal}件 · 平均{(weekTotal / 7).toFixed(1)}/日</span>
              </div>
              <div className="flex items-end gap-1 h-10">
                {week.map((d) => (
                  <div key={d.date} className="flex-1 bg-bg-elevated rounded-sm overflow-hidden flex items-end" title={`${d.date.slice(5)}: ${d.count}件`}>
                    <div className="w-full rounded-sm" style={{ height: `${(d.count / weekMax) * 100}%`, background: "var(--accent-gradient)" }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-text-secondary">今月（過去30日）</span>
                <span className="text-xs text-text-muted tabular-nums">{monthTotal}件 · 平均{(monthTotal / 30).toFixed(1)}/日</span>
              </div>
              <div className="flex items-end gap-[2px] h-10">
                {month.map((d) => (
                  <div key={d.date} className="flex-1 bg-bg-elevated rounded-sm overflow-hidden flex items-end" title={`${d.date.slice(5)}: ${d.count}件`}>
                    <div className="w-full rounded-sm" style={{ height: `${(d.count / monthMax) * 100}%`, background: "var(--accent-gradient)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => {
          const p = store.categoryProgress(cat.id);
          return (<button key={cat.id} onClick={() => onNavigate(cat.id)} className="glass-card rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform" style={{ background: cat.gradient }}>{CATEGORY_ICONS[cat.id]}</div>
            <div className="text-sm font-medium text-text-primary truncate">{cat.label}</div>
            {p ? (<><div className="w-full bg-bg-elevated rounded-full h-1.5 mt-2 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${p.percent}%`, backgroundColor: cat.color }} /></div><div className="text-xs text-text-muted mt-1.5 tabular-nums">{p.done}/{p.total}</div></>) : <div className="text-xs text-text-muted mt-2">タスクなし</div>}
          </button>);
        })}
      </div>

      {/* 期限タスク */}
      {deadlineTasks.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between"><h2 className="font-semibold text-text-primary text-sm">期限付きタスク</h2><span className="text-xs text-text-muted tabular-nums">{deadlineTasks.length}件</span></div>
          <ul>{deadlineTasks.map((task, i) => {
            const cat = CATEGORIES.find((c) => c.id === task.category)!;
            return (<li key={task.id} className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 ${i > 0 ? "border-t border-border-subtle" : ""}`}>
              <button onClick={() => store.completeOneOff(task.id)} className="w-5 h-5 rounded-lg border-2 border-text-muted/30 hover:border-accent-green hover:bg-accent-green hover:text-white flex-shrink-0 flex items-center justify-center transition-all group"><CheckIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" /></button>
              <span className="flex-1 text-sm text-text-primary cursor-pointer hover:text-accent transition-colors" onClick={() => onEdit({ type: "oneoff", task })}>{task.title}</span>
              <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border ${deadlineColor(task.daysLeft)}`}>{deadlineLabel(task.daysLeft)}</span>
              <span className="text-[10px] text-text-muted">{formatDate(task.deadline!)}</span>
              <CatBadge cat={cat} />
            </li>);
          })}</ul>
        </div>
      )}

      {/* 今日の定期タスク（時間帯別） */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-semibold text-text-primary text-sm">今日の定期タスク</h2>
          <span className="text-xs text-text-muted tabular-nums">{todayRec.length}件</span>
        </div>
        {todayRec.length === 0 ? <div className="p-10 text-center text-text-muted text-sm">今日の定期タスクはありません</div> : (
          <div>
            {recBySlot.map(({ slot, tasks }) => (
              <div key={slot.id}>
                <div className={`px-6 py-2 bg-bg-elevated/30 text-[10px] font-semibold tracking-wider ${TIME_COLOR[slot.id]}`}>{slot.label}</div>
                <ul>{tasks.map((task, i) => {
                  const done = store.isRecurringDone(task.id);
                  const cat = CATEGORIES.find((c) => c.id === task.category)!;
                  const streak = store.getStreak(task);
                  return (
                    <li key={task.id} className={i > 0 ? "border-t border-border-subtle" : ""}
                      draggable onDragStart={() => setDragId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(task.id, "recurring")}>
                      <div className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 transition-colors ${done ? "opacity-40" : ""} ${dragId === task.id ? "opacity-50" : ""}`}>
                        <div className="cursor-grab text-text-muted/30 hover:text-text-muted"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>
                        <button onClick={() => store.toggleRecurringCompletion(task.id)}
                          className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? "border-accent-green bg-accent-green text-white" : "border-text-muted/30 hover:border-accent"}`}>
                          {done && <CheckIcon />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm cursor-pointer hover:text-accent transition-colors ${done ? "line-through" : "text-text-primary"}`} onClick={() => onEdit({ type: "recurring", task })}>{task.title}</span>
                            {task.duration && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold tabular-nums">{task.duration}分</span>}
                            {(() => { const sub = calcSubtaskProgress(task.memo); return sub ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold tabular-nums">▢ {sub.done}/{sub.total}</span> : null; })()}
                            {streak >= 3 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent-green/10 text-accent-green font-semibold">{streak}日連続</span>}
                          </div>
                          {task.memo && <MemoButton id={task.id} memo={task.memo} expanded={expandedMemo} setExpanded={setExpandedMemo} />}
                        </div>
                        <CatBadge cat={cat} />
                      </div>
                    </li>
                  );
                })}</ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 今日やる単発タスク */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-semibold text-text-primary text-sm">今日やる単発タスク</h2>
          <button onClick={() => onAdd("oneoff")} className="text-xs text-accent hover:opacity-80 font-semibold flex items-center gap-1"><PlusIcon className="w-3.5 h-3.5" />追加</button>
        </div>
        {todayOff.length === 0 ? <div className="p-10 text-center text-text-muted text-sm">「今日やる」タスクはありません</div> : (
          <ul>{todayOff.map((task, i) => {
            const cat = CATEGORIES.find((c) => c.id === task.category)!;
            const done = !!task.completedAt;
            return (
              <li key={task.id} className={i > 0 ? "border-t border-border-subtle" : ""}
                draggable onDragStart={() => setDragId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(task.id, "oneoff")}>
                <div className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 transition-colors ${done ? "opacity-40" : ""} ${dragId === task.id ? "opacity-50" : ""}`}>
                  <div className="cursor-grab text-text-muted/30 hover:text-text-muted"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>
                  <button onClick={() => store.completeOneOff(task.id)}
                    className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all group ${done ? "border-accent-green bg-accent-green text-white" : "border-text-muted/30 hover:border-accent-green"}`}>
                    {done ? <CheckIcon /> : <CheckIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm cursor-pointer hover:text-accent transition-colors ${done ? "line-through" : "text-text-primary"}`} onClick={() => onEdit({ type: "oneoff", task })}>{task.title}</span>
                      {task.duration && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold tabular-nums">{task.duration}分</span>}
                      {(() => { const sub = calcSubtaskProgress(task.memo); return sub ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold tabular-nums">▢ {sub.done}/{sub.total}</span> : null; })()}
                    </div>
                    {task.memo && <MemoButton id={task.id} memo={task.memo} expanded={expandedMemo} setExpanded={setExpandedMemo} />}
                    {task.deadline && <span className="text-[10px] text-text-muted block mt-0.5">期限: {formatDate(task.deadline)}</span>}
                  </div>
                  <PriorityBadge p={task.priority} />
                  <CatBadge cat={cat} />
                </div>
              </li>
            );
          })}</ul>
        )}
      </div>

      {/* 先のタスク */}
      {upcoming.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle"><h2 className="font-semibold text-text-primary text-sm">まだ着手してないタスク</h2></div>
          <ul>{upcoming.map((task, i) => {
            const cat = CATEGORIES.find((c) => c.id === task.category)!;
            return (<li key={task.id} className={`flex items-center gap-4 px-6 py-3.5 hover:bg-bg-elevated/30 ${i > 0 ? "border-t border-border-subtle" : ""}`}>
              <button onClick={() => store.toggleOneOffToday(task.id)} className="text-[10px] px-2.5 py-1 rounded-lg font-semibold border border-border-subtle text-text-muted hover:border-accent/30 hover:text-accent transition-all">今日やる</button>
              <span className="flex-1 text-sm text-text-secondary cursor-pointer hover:text-accent transition-colors" onClick={() => onEdit({ type: "oneoff", task })}>{task.title}</span>
              {task.deadline && <span className="text-[10px] text-text-muted">{formatDate(task.deadline)}</span>}
              <PriorityBadge p={task.priority} /><CatBadge cat={cat} />
            </li>);
          })}</ul>
        </div>
      )}
    </div>
  );
}

function CatBadge({ cat }: { cat: typeof CATEGORIES[number] }) {
  return <span className="text-[10px] px-2 py-1 rounded-lg font-medium border" style={{ backgroundColor: cat.color + "15", color: cat.color, borderColor: cat.color + "25" }}>{cat.label}</span>;
}
function PriorityBadge({ p }: { p: Priority }) {
  return <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border tabular-nums ${PRIORITY_STYLES[p]}`}>{p}</span>;
}
function MemoButton({ id, memo, expanded, setExpanded }: { id: string; memo: string; expanded: string | null; setExpanded: (v: string | null) => void }) {
  return <button onClick={() => setExpanded(expanded === id ? null : id)} className="text-xs text-text-muted hover:text-text-secondary mt-0.5 truncate max-w-xs block text-left">{expanded === id ? memo : memo.slice(0, 30) + (memo.length > 30 ? "..." : "")}</button>;
}
