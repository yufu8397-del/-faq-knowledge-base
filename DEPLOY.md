# デプロイ手順

このFAQナレッジベースをウェブ上で公開する方法を説明します。

## 方法1: Render（推奨・無料プランあり）

Renderは無料プランがあり、簡単にデプロイできます。

### 手順

1. **Renderアカウントを作成**
   - https://render.com にアクセス
   - GitHubアカウントでサインアップ

2. **GitHubにコードをプッシュ**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin [あなたのGitHubリポジトリURL]
   git push -u origin main
   ```

3. **Renderでサービスを作成**
   - Renderダッシュボードで「New +」→「Web Service」を選択
   - GitHubリポジトリを接続
   - 以下の設定を入力：
     - **Name**: `faq-knowledge-base`
     - **Environment**: `Node`
     - **Build Command**: `npm install && cd client && npm install && npm run build`
     - **Start Command**: `node server/index.js`
     - **Environment Variables**:
       - `NODE_ENV=production`
       - `PORT=10000`

4. **デプロイ**
   - 「Create Web Service」をクリック
   - 数分でデプロイが完了します
   - URLが表示されるので、それを外注者に共有

### 注意点
- 無料プランは15分間アクセスがないとスリープします（最初のアクセス時に起動）
- データベースはRenderのディスクに保存されます（永続化されます）

---

## 方法2: Vercel（フロントエンド）+ Railway（バックエンド）

### フロントエンド（Vercel）

1. **Vercelアカウント作成**
   - https://vercel.com にアクセス
   - GitHubアカウントでサインアップ

2. **フロントエンドをデプロイ**
   - 「New Project」をクリック
   - GitHubリポジトリを選択
   - **Root Directory**: `client` に設定
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**:
     - `REACT_APP_API_URL=https://[railway-url]/api`

3. **デプロイ**

### バックエンド（Railway）

1. **Railwayアカウント作成**
   - https://railway.app にアクセス
   - GitHubアカウントでサインアップ

2. **バックエンドをデプロイ**
   - 「New Project」→「Deploy from GitHub repo」を選択
   - リポジトリを選択
   - **Root Directory**: `server` に設定
   - **Start Command**: `node index.js`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT`（自動設定）

3. **デプロイ後、URLを取得してVercelの環境変数に設定**

---

## 方法3: Heroku（有料プランが必要）

Herokuは無料プランが終了したため、有料プラン（$5/月）が必要です。

### 手順

1. **Herokuアカウント作成**
   - https://heroku.com にアクセス

2. **Heroku CLIをインストール**
   ```bash
   brew install heroku/brew/heroku
   ```

3. **ログイン**
   ```bash
   heroku login
   ```

4. **アプリを作成**
   ```bash
   heroku create faq-knowledge-base
   ```

5. **環境変数を設定**
   ```bash
   heroku config:set NODE_ENV=production
   ```

6. **デプロイ**
   ```bash
   git push heroku main
   ```

---

## 方法4: 自社サーバー（VPS）

### 必要なもの
- VPS（例: AWS EC2, DigitalOcean, Linodeなど）
- ドメイン（オプション）

### 手順

1. **サーバーにSSH接続**
   ```bash
   ssh user@your-server-ip
   ```

2. **Node.jsをインストール**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **コードをクローン**
   ```bash
   git clone [リポジトリURL]
   cd faq-knowledge-base
   npm install
   cd client && npm install && npm run build && cd ..
   ```

4. **PM2でプロセス管理**
   ```bash
   sudo npm install -g pm2
   NODE_ENV=production pm2 start server/index.js --name faq-app
   pm2 save
   pm2 startup
   ```

5. **Nginxでリバースプロキシ設定**（オプション）
   - ポート80/443でアクセスできるように設定

---

## 推奨: Render（方法1）

**理由:**
- ✅ 無料プランあり
- ✅ 簡単にデプロイできる
- ✅ データベースが永続化される
- ✅ HTTPS対応
- ✅ 自動デプロイ（GitHub連携）

**デメリット:**
- 無料プランは15分でスリープ（最初のアクセス時に起動）

---

## デプロイ後の確認事項

1. **APIエンドポイントが正しく動作しているか**
   - `https://[your-url]/api/faqs` にアクセスして確認

2. **フロントエンドがAPIに接続できているか**
   - ブラウザの開発者ツール（F12）でネットワークタブを確認

3. **データベースが永続化されているか**
   - FAQを追加して、再起動後も残っているか確認

---

## 外注者への共有方法

デプロイが完了したら、以下のURLを外注者に共有：

```
https://[your-app-url]
```

ブラウザからアクセスできるので、特別な設定は不要です。
