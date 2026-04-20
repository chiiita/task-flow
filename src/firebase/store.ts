import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./config";
import type { RecurringTask, RecurringCompletion, OneOffTask, ThemeId } from "../types";

export interface CloudData {
  recurring: RecurringTask[];
  completions: RecurringCompletion[];
  oneOff: OneOffTask[];
  theme: ThemeId;
  updatedAt: number;
}

function userDocRef(uid: string) {
  if (!db) throw new Error("Firestore 未設定");
  return doc(db, "users", uid, "data", "main");
}

/**
 * クラウドデータ購読。
 * 自分自身の書き込みによるエコーはスキップする（hasPendingWrites）。
 */
export function subscribeCloudData(
  uid: string,
  onChange: (data: CloudData | null) => void
): () => void {
  if (!db) { onChange(null); return () => {}; }
  const ref = userDocRef(uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.metadata.hasPendingWrites) return; // 自分の書き込みエコーを無視
      if (snap.exists()) onChange(snap.data() as CloudData);
      else onChange(null);
    },
    (err) => {
      console.error("[firestore] subscribe error:", err);
    }
  );
}

export async function saveCloudData(uid: string, payload: Omit<CloudData, "updatedAt">) {
  if (!db) return;
  try {
    await setDoc(userDocRef(uid), { ...payload, updatedAt: Date.now() });
  } catch (err) {
    console.error("[firestore] save error:", err);
  }
}
