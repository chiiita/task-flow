import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages 用: ユーザー名/task-flow 配下で配信されるので base を合わせる
// ローカル開発時は "/" でOK
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/task-flow/" : "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
}));
