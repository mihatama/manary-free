# AWS Amplify でのセットアップ手順

このドキュメントでは、`manary-free`（ローカルストレージ版）を Amplify Hosting にデプロイし、Amplify Auth（Cognito）で認証を構築するまでの流れをまとめます。外部データベースは不要で、カルテはブラウザの `localStorage` に保存されます。

---

## 前提条件

- AWS アカウントと Amplify Hosting の利用権限を保有していること
- Node.js 18.18+ もしくは 20+ と npm がインストール済みであること
- Amplify CLI（Gen 2）がインストール済みであること  
  `npm install -g @aws-amplify/cli`

---

## 1. リポジトリの準備

```bash
git clone https://github.com/mihatama/manary-free.git
cd manary-free
npm install
```

> 初回は `amplify_outputs.json` がプレースホルダーになっています。後述の `amplify pull` を実行して実際の値に置き換えてください。

---

## 2. Amplify バックエンドを構築
AWS 公式ドキュメント「[Build a backend > Auth](https://docs.amplify.aws/react/build-a-backend/auth/)」に沿って、以下のコマンドを実行します。

1. **Amplify プロジェクトを初期化**
   ```bash
   amplify init
   ```
   - フレームワークは **JavaScript / React** を選択
   - 環境名は `dev` など任意で OK

2. **認証機能を追加**
   ```bash
   amplify add auth
   ```
   - 「Default configuration」を選択すると Cognito ユーザープールが自動生成されます
   - サインイン方法は `Email` または `Username` から選択（後から変更可能）

3. **クラウドへデプロイ**
   ```bash
   amplify push
   ```
   - Cognito ユーザープールとクライアントアプリが作成されます

4. **フロントエンド向けに設定を取得**
   ```bash
   amplify pull --appId <AmplifyアプリID> --envName <環境名>
   ```
   - もしくは `amplify push` 後に表示される案内に従って pull してください
   - このコマンドが `amplify_outputs.json` を更新します

> `amplify_outputs.json` をリポジトリにコミットしても構わない運用であれば、そのまま管理してください。秘匿したい場合は Amplify Hosting のビルドステップでファイルを注入する仕組み（Artifact ルールや SSM パラメータなど）を別途用意します。

---

## 3. ローカルでの動作確認
```bash
npm run dev
# http://localhost:3000 にアクセス
```

- `/` に Amplify Auth のサインイン UI が表示され、ログイン成功で `/dashboard` に遷移します。
- カルテはブラウザの `localStorage["manary-free-charts-state"]` に保存されます（端末やブラウザを跨いで共有されません）。

---

## 4. Amplify Hosting へのデプロイ

1. Amplify コンソールで **Amplify Hosting** → **Deploy without Git** または **GitHub 連携** を選択
2. ビルドコマンドを設定
   ```bash
   npm install
   npm run build
   ```
   出力ディレクトリ: `out`
3. ビルド前に `amplify_outputs.json` が正しい値に置き換わっていることを確認
4. デプロイ後、発行された Amplify ドメインで動作を確認

### Amplify CLI での手動デプロイ

```bash
npm run build            # out/ に静的ファイルが生成される
amplify publish          # Amplify Hosting (S3 + CloudFront) にアップロード
```

---

## 5. よくある質問

### Q. データは Amplify に保存されますか？
A. いいえ。カルテはすべてブラウザの `localStorage` に保存されます。端末やブラウザが変わると共有されません。

### Q. ログインできない場合は？
A. `amplify_outputs.json` の値が最新か確認してください。Amplify の環境を作り直した場合は `amplify pull` で再取得が必要です。また、ユーザーが Cognito ユーザープールに存在するか確認してください。

### Q. `amplify_outputs.json` を公開したくないのですが？
A. GitHub にコミットしない運用にする場合は、Amplify Hosting のビルドステップで SSM パラメータや Secrets Manager からファイルを生成するスクリプトを追加してください。

---

## 6. 運用メモ

- 管理者（助産師／スタッフ）の追加・削除は Amplify Auth（Cognito ユーザープール）で行います。
- カルテを初期化したい場合はブラウザの開発者ツールから `localStorage["manary-free-charts-state"]` を削除してください。
- Amplify Hosting のビルドログはコンソールの **Build details** から確認できます。

---

Amplify Auth や UI カスタマイズの詳細は [Amplify UI ドキュメント](https://ui.docs.amplify.aws/react/connected-components/authenticator) を参照してください。質問や改善案があれば Issue からお知らせください。
