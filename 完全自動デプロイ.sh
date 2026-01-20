#!/bin/bash

# FAQナレッジベースの完全自動デプロイスクリプト

set -e

echo "🚀 FAQナレッジベースの完全自動デプロイを開始します..."
echo ""

cd "$(dirname "$0")"

# 1. Gitの状態を確認
echo "📦 Gitの状態を確認中..."
if [ ! -d ".git" ]; then
    git init
fi

# 2. ファイルを追加・コミット
echo "📝 ファイルをコミット中..."
git add . 2>/dev/null || true
git commit -m "Deploy FAQ knowledge base" --allow-empty 2>/dev/null || echo "変更なし"

# 3. GitHub CLIの確認
echo "🔍 GitHub CLIを確認中..."
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLIが見つかりました"
    
    # GitHub認証の確認
    if gh auth status &> /dev/null; then
        echo "✅ GitHubに認証済みです"
        
        # リモートリポジトリの確認
        if ! git remote | grep -q origin; then
            echo "📦 GitHubリポジトリを作成中..."
            REPO_NAME="faq-knowledge-base"
            
            # リポジトリを作成（プライベート）
            gh repo create "$REPO_NAME" --private --source=. --remote=origin --push 2>&1 || {
                echo "⚠️  リポジトリの作成に失敗しました。手動で作成してください。"
                echo ""
                echo "手動で作成する場合："
                echo "1. https://github.com/new にアクセス"
                echo "2. リポジトリ名: faq-knowledge-base"
                echo "3. 「Create repository」をクリック"
                echo "4. 以下のコマンドを実行："
                echo "   git remote add origin https://github.com/[ユーザー名]/faq-knowledge-base.git"
                echo "   git push -u origin main"
                exit 1
            }
            
            echo "✅ GitHubリポジトリを作成しました"
        else
            echo "📤 GitHubにプッシュ中..."
            git push -u origin main 2>&1 || {
                echo "⚠️  プッシュに失敗しました。手動でプッシュしてください。"
                echo "   git push -u origin main"
            }
        fi
    else
        echo "⚠️  GitHubに認証されていません"
        echo ""
        echo "GitHub認証を開始します..."
        echo "ブラウザが開きますので、認証を完了してください。"
        gh auth login --web || {
            echo "⚠️  認証に失敗しました。手動で認証してください："
            echo "   gh auth login"
            exit 1
        }
        
        # 認証後、リポジトリ作成を再試行
        if ! git remote | grep -q origin; then
            REPO_NAME="faq-knowledge-base"
            gh repo create "$REPO_NAME" --private --source=. --remote=origin --push 2>&1 || {
                echo "⚠️  リポジトリの作成に失敗しました"
                exit 1
            }
        fi
    fi
else
    echo "⚠️  GitHub CLIがインストールされていません"
    echo ""
    echo "GitHub CLIをインストールしますか？ (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v brew &> /dev/null; then
            brew install gh
            echo "✅ GitHub CLIをインストールしました"
            echo "再度このスクリプトを実行してください"
        else
            echo "⚠️  Homebrewがインストールされていません"
            echo "手動でGitHub CLIをインストールしてください: https://cli.github.com"
        fi
    else
        echo ""
        echo "手動でGitHubにアップロードしてください："
        echo "1. https://github.com/new にアクセス"
        echo "2. リポジトリ名: faq-knowledge-base"
        echo "3. 以下のコマンドを実行："
        echo "   git remote add origin https://github.com/[ユーザー名]/faq-knowledge-base.git"
        echo "   git push -u origin main"
    fi
    exit 1
fi

echo ""
echo "✨ GitHubへのアップロードが完了しました！"
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
echo ""
echo "または、Render CLIを使って自動デプロイすることもできます（要インストール）"
