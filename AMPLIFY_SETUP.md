# AWS Amplify でのデプロイ手順

このドキュメントでは、`manary-free`（localStorage 版）を AWS Amplify Hosting にデプロイするまでの流れを詳しく紹介します。Supabase などのバックエンドは不要で、静的ホスティングとして Amplify を利用します。

## 前提条件

- AWS アカウントを所有していること
- Amplify Hosting が利用可能なリージョン（例: `ap-northeast-1`）を選択できること
- GitHub リポジトリにアクセスできること（Amplify へ連携する場合）
- Node.js 18 以上と pnpm がローカルにインストール済みであること（ビルド確認用）

## 構成の概要

- Next.js アプリを Amplify Hosting にデプロイ
- サーバーサイドの API やデータベースは利用しない
- 予約・アカウント情報はブラウザの `localStorage`（キー: `manary-local-app-state`）に保存
- Amplify のビルドプロセスでは静的エクスポートを実行し、`out/` ディレクトリを配信

## 1. リポジトリを準備する

1. GitHub 上にこのリポジトリをプッシュするか、フォークを作成します。
2. ブランチを `main` または任意のデプロイ対象に統一しておきます。
3. 必要に応じて README の初期管理者情報を変更してください。

## 2. Amplify コンソールを使ったデプロイ

1. AWS マネジメントコンソールで **Amplify** サービスに移動します。
2. **Amplify Hosting** → **Deploy without Git** または **Deploy from GitHub** を選びます。
3. GitHub 連携を行う場合は、OAuth 認可後にリポジトリとブランチを選択します。
4. ビルド設定の確認:
   - Build コマンド: `pnpm install && pnpm build`
   - Output ディレクトリ: `out`
   - フレームワークは `Next.js` を選択（自動検出される場合が多い）
5. 「保存してデプロイ」を押すと初回ビルドが開始されます。
6. 完了後、Amplify が発行したプレビュー URL（`https://<branch>.amplifyapp.com` など）にアクセスし、アプリが表示されることを確認します。

## 3. Amplify CLI を使ったデプロイ

継続的デプロイではなく単発でアップロードしたい場合、Amplify CLI のホスティング（手動デプロイ）を使用できます。

```bash
npm install -g @aws-amplify/cli
amplify configure           # 初回のみ。IAM ユーザー/ロールを作成しローカルに設定
amplify init                # プロジェクトを初期化。Hosting は "Manual deployment" を選択
amplify add hosting         # Hosting サービスを追加。プロンプトで "Amazon CloudFront and S3" を選択
pnpm install && pnpm build  # Next.js の静的出力を生成
amplify publish             # build 成果物を Amplify にアップロード
```

- `amplify publish` 後に公開 URL が表示されます。
- アップロードされるのは `out/` ディレクトリの静的ファイルです。

## 4. デプロイ後の確認ポイント

- 初期ログイン情報で `/` → `/dashboard` にアクセスできるか
- `/reservation` から予約を登録し、ダッシュボードでステータス更新ができるか
- ブラウザをリロードしても localStorage の値が保持されているか

## 5. よくある質問（FAQ）

### Q. データは Amplify に保存されますか？
A. いいえ。localStorage にのみ保存されます。別の端末やブラウザではデータが共有されません。

### Q. Basic 認証を掛けたい場合は？
A. Amplify のカスタムヘッダー機能でベーシック認証を設定するか、CloudFront + Lambda@Edge などを利用します。Amplify Hosting の「Access control」で IP 制限やパスワード保護を設定できます。

### Q. 独自ドメインや HTTPS はどう設定しますか？
A. Amplify の「Domain management」からカスタムドメインを追加すると、Route 53 などを使って HTTPS 証明書が自動プロビジョニングされます。

## 6. 運用・保守のヒント

- localStorage を初期化するには、ブラウザの開発者ツールで `Application` → `Storage` → `Local Storage` を開き、`manary-local-app-state` を削除します。
- バックアップが必要な場合は、予約データを UI からエクスポートする機能を追加するか、`localStorage` の JSON を手動でコピーして保存します。
- Amplify 側のビルドログは Amplify コンソールの「Build details」から確認できます。失敗した場合はログをダウンロードして原因を調査してください。

## 7. 追加カスタマイズ案

- Amplify の **Preview** 機能を有効化すると、Pull Request ごとにプレビュー URL が発行されます。
- Web アプリに PWA サポートを追加すると、オフラインでも localStorage の内容を参照しやすくなります。
- CloudWatch RUM や Amazon Pinpoint を組み合わせることで利用状況を分析できます（localStorage のデータは送信されません）。

---

Amplify へのデプロイが完了したら、フィードバックをもとに UI やフローを調整していくのがおすすめです。何か問題があれば Issue を作成して共有してください。
