#!/bin/bash

# 最終自動実行スクリプト

set -e

echo "🚀 最終自動実行を開始します..."
echo ""

cd "$(dirname "$0")"

# リモートの確認
if ! git remote | grep -q origin; then
    echo "🔗 リモートを設定中..."
    git remote add origin https://github.com/yufu8397-del/faq-knowledge-base.git
fi

# ブランチ名の確認
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "🌿 ブランチ名をmainに設定中..."
    git branch -M main
fi

# 最新のコミットを確認
echo "📝 最新の状態を確認中..."
git add . 2>/dev/null || true
git commit -m "Auto deploy" --allow-empty 2>/dev/null || echo "変更なし"

# プッシュを試行
echo "📤 GitHubにプッシュを試行中..."
echo ""

# Git credential helperを設定（認証情報を保存）
git config credential.helper store 2>/dev/null || true

# プッシュを試行
if git push -u origin main 2>&1; then
    echo ""
    echo "✅ 成功！GitHubにプッシュしました！"
    echo ""
    echo "次のステップ：Renderでデプロイ"
    echo "1. https://render.com にアクセス"
    echo "2. 「Get Started for Free」→「Continue with GitHub」"
    echo "3. 「New +」→「Web Service」"
    echo "4. リポジトリ「faq-knowledge-base」を選択"
    echo "5. 設定："
    echo "   Build Command: npm install && cd client && npm install && npm run build"
    echo "   Start Command: node server/index.js"
    echo "   Environment Variables: NODE_ENV=production"
    echo "6. 「Create Web Service」をクリック"
else
    echo ""
    echo "⚠️  プッシュに失敗しました"
    echo ""
    echo "考えられる原因："
    echo "1. GitHubでリポジトリが作成されていない"
    echo "2. 認証情報が必要"
    echo ""
    echo "解決方法："
    echo ""
    echo "【ステップ1】GitHubでリポジトリを作成："
    echo "1. https://github.com/yufu8397-del にアクセス"
    echo "2. 「Repositories」タブ → 「New」をクリック"
    echo "3. リポジトリ名: faq-knowledge-base"
    echo "4. 「Create repository」をクリック"
    echo ""
    echo "【ステップ2】再度このスクリプトを実行："
    echo "   ./最終自動実行.sh"
    echo ""
    echo "または、手動でプッシュ："
    echo "   git push -u origin main"
    echo "   （認証情報の入力が求められます）"
fi

echo ""
echo "✨ 実行完了"
