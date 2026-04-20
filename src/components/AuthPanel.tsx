import { useState } from "react";
import { signInGoogle, signOut } from "../firebase/auth";
import type { User } from "firebase/auth";

type Props = {
  user: User | null | undefined;
  cloudEnabled: boolean;
  cloudStatus: "offline" | "syncing" | "synced" | "error";
};

export default function AuthPanel({ user, cloudEnabled, cloudStatus }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!cloudEnabled) {
    return (
      <div className="px-3 py-2 rounded-lg bg-bg-elevated/40 text-[10.5px] leading-relaxed text-text-muted">
        ☁️ クラウド同期 <span className="text-text-secondary">未設定</span>
        <div className="text-[10px] mt-0.5 opacity-70">SETUP_FIREBASE.md を参照</div>
      </div>
    );
  }

  const handleSignIn = async () => {
    setErr(null); setBusy(true);
    try { await signInGoogle(); }
    catch (e) { setErr(e instanceof Error ? e.message : "ログイン失敗"); }
    finally { setBusy(false); }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try { await signOut(); }
    finally { setBusy(false); }
  };

  if (user === undefined) {
    return (
      <div className="px-3 py-2 rounded-lg bg-bg-elevated/40 text-[11px] text-text-muted">
        <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin align-middle mr-2" />
        認証を確認中…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-1.5">
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-bg-elevated/60 text-text-primary border border-border-subtle hover:border-accent/40 hover:bg-accent/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google でサインイン
        </button>
        <div className="px-2 text-[10px] text-text-muted leading-relaxed">
          ログインすると端末間でタスクが同期されます
        </div>
        {err && <div className="px-2 text-[10px] text-red-500">{err}</div>}
      </div>
    );
  }

  const statusColor = cloudStatus === "synced" ? "#22c55e" :
                      cloudStatus === "syncing" ? "#f59e0b" :
                      cloudStatus === "error" ? "#ef4444" : "#94a3b8";
  const statusLabel = cloudStatus === "synced" ? "同期済み" :
                      cloudStatus === "syncing" ? "同期中…" :
                      cloudStatus === "error" ? "同期エラー" : "オフライン";

  return (
    <div className="px-2.5 py-2 rounded-lg bg-bg-elevated/40 text-[11px]">
      <div className="flex items-center gap-2">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent/20 text-accent grid place-items-center text-[10px] font-bold">
            {(user.displayName || user.email || "?").slice(0, 1)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-text-primary truncate font-medium">{user.displayName || user.email}</div>
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={busy}
          title="サインアウト"
          className="text-text-muted hover:text-text-secondary p-1 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  );
}
