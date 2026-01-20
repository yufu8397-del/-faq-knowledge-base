#!/bin/bash

# FAQナレッジベースのデプロイスクリプト

echo "🚀 FAQナレッジベースのデプロイ準備を開始します..."

# 現在のディレクトリを確認
cd "$(dirname "$0")"

# Gitの状態を確認
if [ ! -d ".git" ]; then
    echo "📦 Gitを初期化しています..."
    git init
fi

# ファイルを追加
echo "📝 ファイルを追加しています..."
git add .

# コミット
echo "💾 コミットしています..."
git commit -m "Initial commit for FAQ knowledge base" || echo "既にコミット済みです"

# リモートリポジトリの確認
if ! git remote | grep -q origin; then
    echo ""
    echo "⚠️  GitHubリポジトリが設定されていません"
    echo ""
    echo "次のステップ："
    echo "1. https://github.com にアクセスしてログイン"
    echo "2. 右上の「+」→「New repository」をクリック"
    echo "3. リポジトリ名を入力（例: faq-knowledge-base）"
    echo "4. 「Create repository」をクリック"
    echo "5. 以下のコマンドを実行してください："
    echo ""
    echo "   git remote add origin https://github.com/[あなたのユーザー名]/[リポジトリ名].git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
else
    echo "✅ リモートリポジトリが設定されています"
    echo ""
    echo "GitHubにプッシュするには："
    echo "   git push -u origin main"
    echo ""
fi

echo "✨ 準備完了！"
echo ""
echo "次のステップ："
echo "1. GitHubにコードをプッシュ（上記のコマンドを実行）"
echo "2. https://render.com にアクセス"
echo "3. 「Get Started for Free」→「Continue with GitHub」"
echo "4. 「New +」→「Web Service」をクリック"
echo "5. リポジトリを選択"
echo "6. 設定を入力："
echo "   - Build Command: npm install && cd client && npm install && npm run build"
echo "   - Start Command: node server/index.js"
echo "   - Environment Variables: NODE_ENV=production"
echo "7. 「Create Web Service」をクリック"
