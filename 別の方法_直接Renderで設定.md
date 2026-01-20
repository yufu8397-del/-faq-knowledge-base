# 別の方法：GitHubアプリをスキップして直接Renderで設定

## 問題
GitHubの設定画面で「Save」ボタンが押せない

## 解決方法：直接Renderで設定

GitHubアプリのインストールをスキップして、Renderのサイトから直接GitHubと連携できます。

---

## 手順

### ステップ1: GitHubにコードをアップロード（まだの場合）

まず、GitHubにコードをアップロードする必要があります。

#### 1-1. GitHubでリポジトリを作成
1. https://github.com にアクセス
2. 右上の「+」→「New repository」
3. リポジトリ名を入力（例: `faq-knowledge-base`）
4. 「Create repository」をクリック

#### 1-2. ターミナルでコードをアップロード
```bash
cd /Users/nakajima-yuusuke/Desktop/Cursor/faq-knowledge-base

# まだGitが初期化されていない場合
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリを接続（[ユーザー名]と[リポジトリ名]を実際の値に置き換える）
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git
git branch -M main
git push -u origin main
```

---

### ステップ2: Renderで直接設定

1. **https://render.com にアクセス**
2. **「Get Started for Free」をクリック**
3. **「Continue with GitHub」をクリック**
   - これでGitHubアカウントと連携されます（アプリのインストール画面はスキップされます）
4. **ダッシュボードが表示されたら「New +」→「Web Service」をクリック**
5. **「Connect account」または「Connect GitHub」をクリック**
   - ここでGitHubアカウントを接続します
6. **リポジトリを選択**
   - 先ほど作成したリポジトリ（`faq-knowledge-base`）を選択
7. **設定を入力：**
   - **Name**: `faq-knowledge-base`
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/index.js`
   - **Environment Variables**: `NODE_ENV` = `production`
8. **「Create Web Service」をクリック**

---

## この方法のメリット

- ✅ GitHubアプリのインストール画面をスキップできる
- ✅ Renderのサイトから直接設定できる
- ✅ より簡単で直感的

---

## もしGitHubにコードをアップロードしていない場合

上記のステップ1を先に実行してください。
