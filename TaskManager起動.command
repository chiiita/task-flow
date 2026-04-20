#!/bin/bash
# Task Manager 起動スクリプト
# このウィンドウは開いたままにしてください。閉じるとアプリも止まります。

set -e

APP_DIR="$HOME/task-manager-v2/dist"
PORT=5173

if [ ! -d "$APP_DIR" ]; then
  echo "エラー: $APP_DIR が見つかりません"
  echo "何かキーを押すと閉じます..."
  read -n 1
  exit 1
fi

cd "$APP_DIR"

echo "============================================"
echo "  Task Manager を起動しています..."
echo "============================================"
echo ""
echo "  ブラウザが自動で開きます"
echo "  URL: http://localhost:$PORT"
echo ""
echo "  ※ このウィンドウは閉じないでください"
echo "  ※ 終了するには Ctrl+C を押すか"
echo "    このウィンドウを閉じてください"
echo ""
echo "============================================"

# 2秒後にブラウザを開く
(sleep 2 && open "http://localhost:$PORT") &

# Python3の組み込みHTTPサーバーを起動（macOS標準）
exec python3 -m http.server $PORT
