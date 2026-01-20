# Render環境変数の設定方法

## 環境変数が見つからない場合

RenderのUIによって、環境変数の設定場所が異なる場合があります。

---

## 方法1: 設定画面で探す

### ステップ1: 設定画面を開く

1. **Webサービスを作成する画面で、下にスクロール**
2. **「Environment」や「Environment Variables」というセクションを探す**
3. **または、「Advanced」や「Settings」タブを探す**

### ステップ2: 環境変数を追加

- **「Add Environment Variable」ボタン**
- **「+ Add」ボタン**
- **「New Variable」ボタン**
- **「Add Environment Variable」リンク**

上記のいずれかをクリック

### ステップ3: 値を入力

- **Key**: `NODE_ENV`
- **Value**: `production`
- **「Add」または「Save」をクリック**

---

## 方法2: デプロイ後に設定

環境変数は、デプロイ後でも設定できます。

### ステップ1: サービス画面を開く

1. **デプロイが完了したら、サービス名をクリック**
2. **「Environment」タブをクリック**
3. **「Add Environment Variable」をクリック**

### ステップ2: 値を入力

- **Key**: `NODE_ENV`
- **Value**: `production`
- **「Save Changes」をクリック**

---

## 方法3: 環境変数なしで進める

実は、環境変数 `NODE_ENV=production` は**必須ではありません**。

設定しなくても、アプリは動作します。

ただし、設定した方が：
- 本番環境として最適化される
- パフォーマンスが向上する

---

## 推奨：まずデプロイを進める

環境変数が見つからない場合は：

1. **環境変数を設定せずに「Create Web Service」をクリック**
2. **デプロイを開始**
3. **デプロイ完了後、サービス画面で環境変数を追加**

---

## デプロイ後の環境変数設定

1. **サービス名をクリック**（ダッシュボードから）
2. **「Environment」タブをクリック**
3. **「Add Environment Variable」をクリック**
4. **Key**: `NODE_ENV`、Value: `production` を入力
5. **「Save Changes」をクリック**
6. **「Manual Deploy」→「Deploy latest commit」をクリック**（再デプロイ）

---

## 重要

環境変数は後からでも追加できるので、まずはデプロイを進めてください！
