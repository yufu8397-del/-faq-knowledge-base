#!/bin/bash

# 完全自動デプロイ - 公開まで

set -e

echo "🚀 FAQナレッジベースを公開まで自動デプロイします..."
echo ""

cd "$(dirname "$0")"

# 1. Gitの準備
echo "📦 Gitの準備中..."
if [ ! -d ".git" ]; then
    git init
fi

git add . 2>/dev/null || true
git commit -m "Deploy to production" --allow-empty 2>/dev/null || echo "変更なし"

# リモートの設定
if ! git remote | grep -q origin; then
    git remote add origin https://github.com/yufu8397-del/faq-knowledge-base.git
fi

git branch -M main 2>/dev/null || true

# 2. GitHubにプッシュを試行
echo "📤 GitHubにプッシュを試行中..."
echo ""

# credential helperを設定
git config credential.helper store 2>/dev/null || true

# プッシュを試行
PUSH_RESULT=$(git push -u origin main 2>&1) || PUSH_ERROR=$?

if [ -z "$PUSH_ERROR" ]; then
    echo "✅ GitHubへのプッシュが成功しました！"
    echo ""
else
    echo "⚠️  プッシュに失敗しました"
    echo ""
    echo "GitHubでリポジトリを作成する必要があります："
    echo "1. https://github.com/yufu8397-del にアクセス"
    echo "2. 「Repositories」タブ → 「New」をクリック"
    echo "3. リポジトリ名: faq-knowledge-base"
    echo "4. 「Create repository」をクリック"
    echo "5. その後、このスクリプトを再実行してください"
    echo ""
    echo "または、手動でプッシュ："
    echo "   git push -u origin main"
    exit 1
fi

# 3. Renderでのデプロイ準備
echo "🌐 Renderでのデプロイ準備中..."
echo ""
echo "次のステップ：Renderでデプロイ"
echo ""
echo "【自動デプロイ手順】"
echo "1. https://render.com にアクセス"
echo "2. 「Get Started for Free」→「Continue with GitHub」"
echo "3. 「New +」→「Web Service」をクリック"
echo "4. リポジトリ「faq-knowledge-base」を選択"
echo "5. 設定を入力："
echo ""
echo "   Name: faq-knowledge-base"
echo "   Build Command: npm install && cd client && npm install && npm run build"
echo "   Start Command: node server/index.js"
echo "   Environment Variables:"
echo "     Key: NODE_ENV"
echo "     Value: production"
echo ""
echo "6. 「Create Web Service」をクリック"
echo "7. 5-10分待つ"
echo ""
echo "【完了後】"
echo "表示されたURL（例: https://faq-knowledge-base.onrender.com）が"
echo "あなたのアプリの公開URLです！"
echo ""
echo "✨ 準備完了！Renderでデプロイを開始してください。"
