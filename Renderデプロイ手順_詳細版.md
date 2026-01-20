# Renderデプロイ手順（詳細版）

## ✅ ログイン完了

次は、Webサービスを作成してデプロイします。

---

## ステップ1: 新しいWebサービスを作成

1. **Renderのダッシュボードで「New +」ボタンをクリック**
   - 画面右上または中央に表示されています
   - 「+」アイコンまたは「New」というボタン

2. **「Web Service」を選択**
   - ドロップダウンメニューから選択
   - または、カード形式で表示されている場合は「Web Service」のカードをクリック

---

## ステップ2: GitHubリポジトリを接続

1. **「Connect account」または「Connect GitHub」をクリック**
   - まだGitHubアカウントを接続していない場合

2. **GitHubの認証画面で「Authorize render」をクリック**

3. **リポジトリを選択**
   - `faq-knowledge-base` を探して選択
   - 検索バーで「faq-knowledge-base」と検索してもOK

---

## ステップ3: 設定を入力

### 基本設定

- **Name**: `faq-knowledge-base`（自動入力されているはず）
- **Region**: `Singapore` または `Oregon`（日本に近い地域を選択）

### ビルド設定

- **Environment**: `Node`（自動選択されているはず）

- **Build Command**: 
  ```
  npm install && cd client && npm install && npm run build
  ```
  （このコマンドをコピー&ペーストしてください）

- **Start Command**: 
  ```
  node server/index.js
  ```
  （このコマンドをコピー&ペーストしてください）

### 環境変数

1. **「Add Environment Variable」をクリック**
2. **Key**: `NODE_ENV`
3. **Value**: `production`
4. **「Add」をクリック**

---

## ステップ4: デプロイ開始

1. **ページの一番下の「Create Web Service」ボタンをクリック**

2. **デプロイが開始されます**
   - ビルドログが表示されます
   - 5-10分かかります

3. **「Live」と表示されれば完了！**
   - URLが表示されます（例: `https://faq-knowledge-base.onrender.com`）

---

## 完了後

表示されたURLを：
- ✅ ブラウザで開いて動作確認
- ✅ 外注者に共有

---

## トラブルシューティング

### ビルドが失敗する場合
- Build Commandが正しいか確認（コピー&ペースト推奨）
- ログを確認してエラー内容を確認

### アプリが起動しない場合
- Start Commandが正しいか確認
- 環境変数 `NODE_ENV=production` が設定されているか確認

### リポジトリが見つからない場合
- GitHubでリポジトリが作成されているか確認
- GitHubアカウントが正しく接続されているか確認
