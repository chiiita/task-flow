import { useState, useRef } from "react";
import { useTaskStore } from "../hooks/useTaskStore";
import { XIcon } from "./Icons";

interface Props {
  store: ReturnType<typeof useTaskStore>;
  onClose: () => void;
}

export default function BackupModal({ store, onClose }: Props) {
  const [message, setMessage] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = store.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `taskflow-backup-${ymd}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "ok", text: "バックアップファイルをダウンロードしました" });
  };

  const handleImport = (mode: "replace" | "merge") => {
    const input = fileRef.current;
    if (!input || !input.files || input.files.length === 0) {
      setMessage({ type: "error", text: "ファイルを選択してください" });
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (mode === "replace" && !confirm("現在のデータを全て上書きします。本当によろしいですか？")) return;
      const result = store.importData(text, mode);
      setMessage({ type: result.ok ? "ok" : "error", text: result.message });
      if (result.ok) input.value = "";
    };
    reader.readAsText(file);
  };

  const stats = {
    recurring: store.recurring.length,
    oneOff: store.oneOff.length,
    completions: store.completions.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-2xl shadow-2xl w-full max-w-md border border-border-subtle overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="relative px-6 py-5 border-b border-border-subtle">
          <div className="absolute inset-0 opacity-10" style={{ background: "var(--accent-gradient)" }} />
          <div className="relative flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">バックアップ・復元</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-elevated/50">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 現在のデータ */}
          <div className="bg-bg-primary/50 rounded-xl p-4 border border-border-subtle">
            <h3 className="text-xs font-semibold text-text-muted tracking-wider mb-2">現在のデータ</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-xl font-bold text-text-primary tabular-nums">{stats.recurring}</div><div className="text-[10px] text-text-muted">定期タスク</div></div>
              <div><div className="text-xl font-bold text-text-primary tabular-nums">{stats.oneOff}</div><div className="text-[10px] text-text-muted">単発タスク</div></div>
              <div><div className="text-xl font-bold text-text-primary tabular-nums">{stats.completions}</div><div className="text-[10px] text-text-muted">完了履歴</div></div>
            </div>
          </div>

          {/* エクスポート */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-2">バックアップを書き出す</h3>
            <p className="text-xs text-text-muted mb-3">全データをJSONファイルでダウンロードします。定期的に保存しておくと安心です。</p>
            <button
              onClick={handleExport}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent-gradient)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              バックアップをダウンロード
            </button>
          </div>

          {/* インポート */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary tracking-wider mb-2">バックアップから復元</h3>
            <p className="text-xs text-text-muted mb-3">以前エクスポートしたJSONファイルから読み込みます。</p>
            <input ref={fileRef} type="file" accept="application/json,.json"
              className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-bg-elevated file:text-text-primary file:text-xs file:font-semibold hover:file:bg-bg-elevated/70 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleImport("merge")}
                className="py-2.5 rounded-xl text-xs font-semibold border border-border-medium text-text-secondary hover:border-accent/30 hover:text-accent transition-all"
              >
                追加で読み込む
              </button>
              <button
                onClick={() => handleImport("replace")}
                className="py-2.5 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                全て上書き
              </button>
            </div>
          </div>

          {/* メッセージ */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                message.type === "ok"
                  ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                  : message.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-accent/10 text-accent border border-accent/20"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
