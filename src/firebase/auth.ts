import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from "firebase/auth";
import { auth, firebaseEnabled } from "./config";

/**
 * 認証ユーザー購読フック
 * undefined = 読込中 / null = 未ログイン / User = ログイン済み
 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    if (!auth) { setUser(null); return; }
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);
  return user;
}

export async function signInGoogle() {
  if (!auth) throw new Error("Firebase 未設定です。.env.local を確認してください");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOut() {
  if (!auth) return;
  await fbSignOut(auth);
}

export { firebaseEnabled };
