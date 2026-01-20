# FAQ ナレッジベースシステム

YouTube運営会社向けのFAQ/ナレッジベース管理ツールです。外注者からのよくある質問を集約し、過去の質問には自動で回答できるシステムです。

## 主な機能

- 🔍 **全文検索**: 質問内容を入力するだけで、過去のFAQから自動で回答を検索
- 📝 **FAQ管理**: 質問と回答の追加・編集・削除が簡単にできる
- 🏷️ **カテゴリ・タグ機能**: FAQをカテゴリやタグで分類・絞り込み
- 📊 **統計情報**: 登録FAQ数、検索回数、成功率などの統計を表示
- 👍 **評価機能**: 回答が役に立ったかを評価できる
- 🔐 **権限管理**: スタッフ（管理者）と受講生（一般ユーザー）で権限を分離
- 📄 **チャット履歴自動抽出**: LINEのトーク履歴などから質問と回答を自動抽出してFAQに追加
- 📱 **レスポンシブデザイン**: PC・タブレット・スマホに対応

---

## セットアップ方法

### 1. 必要な環境

- Node.js (v16以上)
- npm または yarn

### 2. インストール

```bash
# プロジェクトディレクトリに移動
cd faq-knowledge-base

# バックエンドの依存関係をインストール
npm install

# フロントエンドの依存関係をインストール
cd client
npm install
cd ..
```

### 3. 起動方法

#### 開発モード（推奨）

```bash
# バックエンドとフロントエンドを同時に起動
npm run dev
```

または、別々のターミナルで起動：

```bash
# ターミナル1: バックエンドサーバー
npm run server

# ターミナル2: フロントエンド
npm run client
```

#### 本番モード

```bash
# フロントエンドをビルド
npm run build

# サーバーを起動
npm start
```

### 4. アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

---

## 使い方

### 受講生（一般ユーザー）

1. **URLにアクセス**
2. **検索バーで質問を入力**
   - 質問を入力すると、過去のFAQから自動で回答を検索
3. **FAQを閲覧**
   - 検索結果からFAQをクリックして詳細を確認
   - 「役に立った」ボタンで評価

**制限**: FAQの追加・編集・削除はできません

### スタッフ（管理者）

#### ログイン

1. **URLにアクセス**
2. **画面中央のログインフォームでパスワードを入力**
   - デフォルトパスワード: `admin123`
   - ⚠️ 本番環境では必ず変更してください
3. **「ログイン」ボタンをクリック**

**自動ログイン**: 一度ログインすれば、7日間は自動でログイン状態が維持されます

#### FAQの追加

1. サイドバーの「+ 新しいFAQを追加」ボタンをクリック
2. 質問、回答、カテゴリ、タグを入力
3. 「追加」ボタンをクリック

#### チャット履歴から自動抽出

1. サイドバーの「📄 チャット履歴から自動抽出」ボタンをクリック
2. LINEのトーク履歴ファイル（.txt）を選択
3. 「📤 質問と回答を抽出」ボタンをクリック
4. 抽出された質問と回答を確認・選択
5. 「✅ X件をFAQに追加」ボタンをクリック

#### FAQの編集・削除

1. FAQをクリックして展開
2. 「編集」ボタンで内容を変更
3. 「削除」ボタンでFAQを削除

---

## デプロイ方法（Render）

### ステップ1: GitHubにコードをアップロード

```bash
cd /Users/nakajima-yuusuke/Desktop/Cursor/faq-knowledge-base
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[あなたのユーザー名]/[リポジトリ名].git
git branch -M main
git push -u origin main
```

**Personal Access Tokenが必要な場合:**
1. https://github.com/settings/tokens にアクセス
2. 「Generate new token (classic)」をクリック
3. スコープ: `repo` にチェック
4. トークンをコピーしてプッシュ時に使用

### ステップ2: Renderでデプロイ

1. **https://render.com にアクセス**
2. **「Get Started for Free」→「Continue with GitHub」**
3. **「New +」→「Web Service」をクリック**
4. **リポジトリを選択**
5. **設定を入力:**
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/index.js`
   - **Environment Variables**: 
     - `NODE_ENV` = `production`
     - `ADMIN_PASSWORD` = [管理者パスワード]（推奨）
     - `JWT_SECRET` = [ランダムな文字列]（推奨）
6. **「Create Web Service」をクリック**
7. **5-10分待つ**

### ステップ3: 完了

表示されたURL（例: `https://faq-knowledge-base.onrender.com`）が公開URLです。

---

## 環境変数の設定

### 本番環境での推奨設定

Renderのダッシュボードで環境変数を設定：

- **ADMIN_PASSWORD**: 管理者パスワード（デフォルト: `admin123`）
- **JWT_SECRET**: JWTトークンの秘密鍵（ランダムな文字列）
- **NODE_ENV**: `production`

### 設定方法

1. Renderのダッシュボードでサービスを選択
2. 「Environment」タブをクリック
3. 「Add Environment Variable」をクリック
4. KeyとValueを入力
5. 「Save Changes」をクリック
6. 再デプロイ

---

## 技術スタック

- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express
- **データベース**: SQLite (FTS5全文検索対応)
- **認証**: JWT (JSON Web Token)
- **スタイリング**: CSS3 (モダンなUI)

---

## データベース

SQLiteデータベースは `server/database.db` に自動で作成されます。

### テーブル構造

- `faqs`: FAQのメインテーブル
- `faqs_fts`: 全文検索用の仮想テーブル
- `search_logs`: 検索ログ（統計用）
- `admin_settings`: 管理者設定（パスワードハッシュ）

---

## トラブルシューティング

### ログインできない

- パスワードが正しいか確認（デフォルト: `admin123`）
- 環境変数 `ADMIN_PASSWORD` が設定されているか確認
- ブラウザのキャッシュをクリア

### デプロイが失敗する

- Build Commandが正しいか確認
- ログを確認してエラー内容を確認
- 環境変数が正しく設定されているか確認

### チャット履歴が抽出されない

- ファイル形式が正しいか確認（.txt形式）
- 質問が「？」で終わっているか確認
- ファイルサイズが10MB以下か確認

---

## ライセンス

MIT
