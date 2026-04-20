import { useState, useEffect, type ReactNode } from "react";
import { useTaskStore } from "./hooks/useTaskStore";
import { CATEGORIES, Category, RecurringTask, OneOffTask } from "./types";
import Dashboard from "./components/Dashboard";
import CategoryPage from "./components/CategoryPage";
import Calendar from "./components/Calendar";
import AddTaskModal from "./components/AddTaskModal";
import EditTaskModal from "./components/EditTaskModal";
import BackupModal from "./components/BackupModal";
import ThemeSwitcher, { applyTheme } from "./components/ThemeSwitcher";
import AuthPanel from "./components/AuthPanel";
import {
  DashboardIcon, BriefcaseIcon, BookIcon, UserIcon, HeartIcon, TagIcon,
  PlusIcon, MenuIcon, BoltIcon, ClockIcon,
} from "./components/Icons";

type Page = "dashboard" | "calendar" | Category;

const CATEGORY_ICONS: Record<Category, ReactNode> = {
  work: <BriefcaseIcon className="w-4.5 h-4.5" />,
  skill: <BookIcon className="w-4.5 h-4.5" />,
  personal: <UserIcon className="w-4.5 h-4.5" />,
  habit: <HeartIcon className="w-4.5 h-4.5" />,
  other: <TagIcon className="w-4.5 h-4.5" />,
};

export default function App() {
  const store = useTaskStore();
  const [page, setPage] = useState<Page>("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"recurring" | "oneoff">("oneoff");
  const [addCategory, setAddCategory] = useState<Category>("work");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: "recurring"; task: RecurringTask } | { type: "oneoff"; task: OneOffTask } | null>(null);
  const [showBackup, setShowBackup] = useState(false);

  // Apply theme on load and change
  useEffect(() => { applyTheme(store.theme); }, [store.theme]);

  if (!store.loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    );
  }

  const openAdd = (type: "recurring" | "oneoff", cat?: Category) => {
    setAddType(type);
    setAddCategory(cat || (page !== "dashboard" && page !== "calendar" ? (page as Category) : "work"));
    setShowAdd(true);
  };

  const pageTitle = page === "dashboard" ? "ダッシュボード" : page === "calendar" ? "カレンダー" : CATEGORIES.find((c) => c.id === page)?.label;

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* サイドバー */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-bg-secondary border-r border-border-subtle flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--accent-gradient)" }}>
              <BoltIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight">タスクフロー</h1>
              <p className="text-xs text-text-muted">
                {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
              </p>
            </div>
          </div>
          <ThemeSwitcher current={store.theme} onChange={store.setTheme} />
          <div className="mt-3">
            <AuthPanel user={store.user} cloudEnabled={store.cloudEnabled} cloudStatus={store.cloudStatus} />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setPage("dashboard"); setSidebarOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${page === "dashboard" ? "bg-accent/15 text-accent" : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"}`}>
            <DashboardIcon className="w-5 h-5" />ダッシュボード
          </button>
          <button onClick={() => { setPage("calendar"); setSidebarOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${page === "calendar" ? "bg-accent/15 text-accent" : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            カレンダー
          </button>

          <div className="pt-5 pb-2 px-3"><span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.15em]">カテゴリ</span></div>
          {CATEGORIES.map((cat) => {
            const progress = store.categoryProgress(cat.id);
            const isActive = page === cat.id;
            return (
              <button key={cat.id} onClick={() => { setPage(cat.id); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"}`}
                style={isActive ? { backgroundColor: cat.color + "20", color: cat.color } : {}}>
                <span style={isActive ? { color: cat.color } : {}}>{CATEGORY_ICONS[cat.id]}</span>
                <span className="flex-1">{cat.label}</span>
                {progress && <span className="text-xs tabular-nums opacity-60">{progress.done}/{progress.total}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <button onClick={() => openAdd("oneoff")}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--accent-gradient)" }}>
            <PlusIcon className="w-4 h-4" />単発タスク追加
          </button>
          <button onClick={() => openAdd("recurring")}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-border-medium transition-all duration-200 hover:text-text-primary hover:border-accent/30 hover:bg-accent/5 flex items-center justify-center gap-2">
            <ClockIcon className="w-4 h-4" />定期タスク追加
          </button>
          <button onClick={() => setShowBackup(true)}
            className="w-full px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50 transition-all flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            バックアップ・復元
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-20 bg-bg-secondary/80 backdrop-blur-xl border-b border-border-subtle px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-bg-elevated/50 text-text-secondary"><MenuIcon /></button>
          <h2 className="font-semibold text-text-primary">{pageTitle}</h2>
        </div>
        <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto">
          {page === "dashboard" && <Dashboard store={store} onNavigate={setPage} onAdd={openAdd} onEdit={setEditTarget} />}
          {page === "calendar" && <Calendar store={store} />}
          {page !== "dashboard" && page !== "calendar" && <CategoryPage category={page as Category} store={store} onAdd={openAdd} onEdit={setEditTarget} />}
        </div>
      </main>

      {showAdd && <AddTaskModal type={addType} defaultCategory={addCategory} store={store} onClose={() => setShowAdd(false)} />}
      {editTarget && <EditTaskModal target={editTarget} store={store} onClose={() => setEditTarget(null)} />}
      {showBackup && <BackupModal store={store} onClose={() => setShowBackup(false)} />}
    </div>
  );
}
