# 🔥 Firebase セットアップ手順（初心者向け）

端末をまたいだ同期（iPhone・Mac・他PC）を有効にするため、Firebase を使います。
Firebase は Google の無料クラウドサービスで、個人利用の範囲なら完全無料です。

---

## 📝 所要時間: 約10分

全部ブラウザ操作です。コマンド入力はありません。

---

## Step 1 — Firebase プロジェクトを作成

1. https://console.firebase.google.com を開く
2. Google アカウントでログイン（普段使ってるアカウントでOK）
3. **「プロジェクトを追加」** をクリック
4. プロジェクト名: `task-flow` と入力（好きな名前でOK）
5. 「このプロジェクトで Google アナリティクスを有効にする」は **オフ** で可（任意）
6. **「プロジェクトを作成」** → 少し待つ → **「続行」**

---

## Step 2 — Authentication（ログイン機能）を有効化

1. 左メニューから **「構築 → Authentication」** をクリック
2. **「始める」** をクリック
3. **Sign-in method** タブで **「Google」** を選択
4. **「有効にする」** をトグルON
5. プロジェクトのサポートメール: 自分のGmailを選択
6. **「保存」**

---

## Step 3 — Firestore（データベース）を有効化

1. 左メニューから **「構築 → Firestore Database」** をクリック
2. **「データベースの作成」** をクリック
3. **本番環境モードで開始** を選択 → **「次へ」**
4. ロケーション: **「asia-northeast1 (東京)」** を選択 → **「有効にする」**
5. 少し待つとダッシュボードが開きます

### セキュリティルール設定（重要）

6. **「ルール」** タブに切り替え
7. 既存のルール（2行目の `allow read, write: if false;`）を以下に置き換え:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

8. **「公開」** をクリック

これで「ログインしたユーザーは自分のデータだけ読み書き可能」というルールになります。

---

## Step 4 — Web アプリを登録（接続情報を取得）

1. 左上の **⚙️（歯車）→ プロジェクトの設定**
2. 「マイアプリ」セクションまでスクロール
3. **`</>`（Web）** アイコンをクリック
4. アプリのニックネーム: `task-flow-web` と入力
5. **「このアプリの Firebase Hosting も設定する」は チェックなし** でOK
6. **「アプリを登録」**
7. 表示される `firebaseConfig` をコピー（重要）:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "task-flow-xxxxx.firebaseapp.com",
  projectId: "task-flow-xxxxx",
  storageBucket: "task-flow-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc..."
};
```

8. **「コンソールに進む」** をクリック（完了）

---

## Step 5 — `.env.local` を作成して認証情報を設定

プロジェクトフォルダ `/Users/sk/task-manager-v2/` に **`.env.local`** ファイルを新規作成し、以下を貼り付けます（値は Step 4 でコピーした自分のものに置き換え）:

```sh
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=task-flow-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=task-flow-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=task-flow-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc...
```

**簡単な作成方法**:
```bash
cd /Users/sk/task-manager-v2
touch .env.local
open -e .env.local   # デフォルトエディタで開く
# → 上記内容を貼り付けて保存
```

**⚠️ 重要**:
- `.env.local` は **絶対に GitHub にアップロードしない**（次の Phase 5C で `.gitignore` に含めます）
- ただし Firebase の API キーは「公開可能な識別子」なので、漏れても直接のリスクは低い（セキュリティルールで守られているため）

---

## Step 6 — 承認済みドメイン追加（後で使う）

GitHub Pages公開時に必要な設定です。今すぐでなくてOKですが、覚えておいてください。

1. Firebase Console → **Authentication → 設定 → 承認済みドメイン**
2. **「ドメインの追加」** をクリック
3. GitHub Pages のドメインを追加: `ユーザー名.github.io` （例: `youaretripping003.github.io`）

---

## ✅ セットアップ完了チェック

- [ ] プロジェクト作成済み
- [ ] Google サインイン有効化済み
- [ ] Firestore 作成＆セキュリティルール更新済み
- [ ] `.env.local` にFirebase Config記入済み
- [ ] `.env.local` の各値が自分のプロジェクトのもの

この状態で次のステップへ。

---

## Step 7 — firebase SDK インストール＆起動

ターミナルで以下を実行:

```bash
cd /Users/sk/task-manager-v2
rm -rf node_modules package-lock.json
npm install
npm run dev
```

- `rm -rf node_modules package-lock.json` は一度だけ必要（破損キャッシュのクリア）
- 完了すると http://localhost:5173 でアプリが開きます
- ブラウザのサイドバー下部に **「Google でサインイン」** ボタンが出ます
- クリック → Googleログイン → ✅ 同期済みマークが出ればOK

### ビルド（本番用・GitHub Pages用）
```bash
npm run build
# dist/ に出力される
```

---

## 💰 料金について

Firebase の無料枠（Spark プラン）:
- Authentication: **無制限**
- Firestore: 1日 **50,000 読み取り / 20,000 書き込み**
- ストレージ: **1GB**

個人のタスク管理用途なら、まず絶対に超えません。
クレジットカード登録不要で使えます。

---

## 🆘 困ったら

| 問題 | 解決策 |
|---|---|
| Googleログインでエラー | Step 6 の承認済みドメインを確認 |
| データが保存されない | Firestore セキュリティルールを確認 |
| プロジェクト削除したい | Firebase Console → 設定 → プロジェクトを削除 |
