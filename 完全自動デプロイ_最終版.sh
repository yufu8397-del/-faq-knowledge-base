#!/bin/bash

# FAQナレッジベースの完全自動デプロイスクリプト（最終版）

set -e

echo "🚀 FAQナレッジベースの完全自動デプロイを開始します..."
echo ""

cd "$(dirname "$0")"

# 1. Gitの状態確認
echo "📦 Gitの状態を確認中..."
if [ ! -d ".git" ]; then
    git init
fi

# 2. ファイルをコミット
echo "📝 ファイルをコミット中..."
git add . 2>/dev/null || true
git commit -m "Deploy FAQ knowledge base" --allow-empty 2>/dev/null || echo "変更なし"

# 3. リモートの設定
echo "🔗 リモートリポジトリを設定中..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/yufu8397-del/faq-knowledge-base.git 2>/dev/null || echo "リモートは既に設定済み"

# 4. ブランチ名をmainに設定
echo "🌿 ブランチ名を設定中..."
git branch -M main 2>/dev/null || echo "ブランチ名は既にmain"

# 5. GitHubにプッシュを試行
echo "📤 GitHubにプッシュを試行中..."
echo ""

# 認証情報を保存（Git Credential Helperを使用）
git config --global credential.helper store 2>/dev/null || true

# プッシュを試行（認証が必要な場合は失敗する）
if git push -u origin main 2>&1; then
    echo "✅ GitHubへのプッシュが成功しました！"
    echo ""
    echo "次のステップ：Renderでデプロイ"
    echo "1. https://render.com にアクセス"
    echo "2. 「Get Started for Free」→「Continue with GitHub」"
    echo "3. 「New +」→「Web Service」をクリック"
    echo "4. リポジトリ「faq-knowledge-base」を選択"
    echo "5. 設定を入力："
    echo "   - Build Command: npm install && cd client && npm install && npm run build"
    echo "   - Start Command: node server/index.js"
    echo "   - Environment Variables: NODE_ENV=production"
    echo "6. 「Create Web Service」をクリック"
else
    echo "⚠️  プッシュに失敗しました"
    echo ""
    echo "原因："
    echo "1. GitHubでリポジトリが作成されていない"
    echo "2. 認証情報が必要"
    echo ""
    echo "解決方法："
    echo ""
    echo "【方法1】GitHubでリポジトリを作成してから再実行："
    echo "1. https://github.com/yufu8397-del にアクセス"
    echo "2. 「Repositories」タブ → 「New」をクリック"
    echo "3. リポジトリ名: faq-knowledge-base"
    echo "4. 「Create repository」をクリック"
    echo "5. このスクリプトを再実行"
    echo ""
    echo "【方法2】手動でプッシュ："
    echo "   git push -u origin main"
    echo "   （認証情報の入力が求められます）"
    echo ""
    echo "【方法3】Personal Access Tokenを使用："
    echo "1. https://github.com/settings/tokens でトークンを作成"
    echo "2. ユーザー名: yufu8397-del"
    echo "3. パスワード: [作成したトークン]"
    echo "4. git push -u origin main を実行"
fi

echo ""
echo "✨ スクリプトの実行が完了しました"
