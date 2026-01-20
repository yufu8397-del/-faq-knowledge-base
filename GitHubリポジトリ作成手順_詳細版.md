# GitHubリポジトリ作成手順（詳細版）

## 現在の画面
GitHubの「Repositories」タブが表示されています。

## 手順

### ステップ1: 「New」ボタンをクリック
現在の画面の右上（検索バーの右側）に**緑色の「New」ボタン**があります。
このボタンをクリックしてください。

### ステップ2: リポジトリ作成ページで入力
「New」ボタンをクリックすると、リポジトリ作成ページに移動します。

以下の情報を入力：

1. **Repository name（リポジトリ名）**: 
   ```
   faq-knowledge-base
   ```

2. **Description（説明）**: 
   - 空欄でもOK
   - または「FAQ Knowledge Base System」など

3. **Public / Private（公開設定）**: 
   - 「Public」または「Private」を選択
   - どちらでもOK

4. **その他のオプション**:
   - 「Add a README file」: ✅ チェックを**外す**（既にコードがあるため）
   - 「Add .gitignore」: ✅ チェックを**外す**
   - 「Choose a license」: 「None」のまま

### ステップ3: 「Create repository」ボタンをクリック
ページの一番下に**緑色の「Create repository」ボタン**があります。
このボタンをクリックしてください。

---

## もし「New」ボタンが見つからない場合

### 方法1: 直接URLでアクセス
以下のURLに直接アクセス：
```
https://github.com/new
```

### 方法2: 右上の「+」アイコンから
1. 画面右上の「+」アイコン（プラス記号）をクリック
2. 「New repository」を選択

---

## リポジトリ作成後の確認

リポジトリが作成されると、以下のようなページが表示されます：
- 「Quick setup」というセクション
- 「…or push an existing repository from the command line」という項目

このページが表示されれば、リポジトリの作成は成功です！

---

## 次のステップ

リポジトリが作成されたら、ターミナルで以下を実行：

```bash
cd /Users/nakajima-yuusuke/Desktop/Cursor/faq-knowledge-base
git push -u origin main
```

認証情報の入力が求められたら：
- ユーザー名: `yufu8397-del`
- パスワード: GitHubのパスワード（またはPersonal Access Token）
