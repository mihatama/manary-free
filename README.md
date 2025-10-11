# Manary - Amplify Local Storage Edition

Manary は助産院向けの予約・顧客管理アプリケーションです。このリポジトリでは、Supabase などの外部データベースを使わず、ブラウザの Web Storage（localStorage）に情報を保存する無料プラン向け構成へ刷新しています。Next.js で構築されているため、AWS Amplify を使って簡単にホスティングできます。

## 主な特徴

- **ローカルストレージ管理**: 予約や管理者情報はすべてブラウザの localStorage に保存されます。バックエンドやデータベースは不要です。
- **管理ダッシュボード**: 管理者ログイン後に予約の一覧を閲覧し、ステータス（確認待ち・確定・キャンセル）を更新できます。
- **公開予約フォーム**: 利用者が `/reservation` ページから予約を登録すると、即座にダッシュボードに反映されます。
- **AWS Amplify でのデプロイを想定**: ビルドコマンドや環境変数を必要としないため、Amplify に接続するだけでデプロイできます。

## 技術スタック

- [Next.js 15 (App Router)](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) をベースにしたコンポーネント
- データ保存: ブラウザ localStorage（`manary-local-app-state` キー）

## プロジェクト構成

```text
manary-free/
├── app/
│   ├── dashboard/          # 管理ダッシュボード
│   ├── reservation/        # 公開予約フォーム
│   ├── layout.tsx          # ルートレイアウト（プロバイダーをラップ）
│   └── page.tsx            # ログインページ
├── components/
│   ├── providers/          # localStorage を扱うアプリケーションステート
│   ├── login-form.tsx
│   └── ui/                 # UI コンポーネント
├── lib/                    # ユーティリティ（必要に応じて拡張）
└── public/                 # 画像などの静的アセット
```

## セットアップ手順

1. リポジトリをクローン
   ```bash
   git clone https://github.com/your-username/manary-free.git
   cd manary-free
   pnpm install   # または npm install / yarn install
   ```
2. ローカル開発サーバーを起動
   ```bash
   pnpm dev
   ```
3. ブラウザで `http://localhost:3000` を開く

### 初期アカウント

- メールアドレス: `admin@manary.local`
- パスワード: `password123`

ログインするとダッシュボードが開き、`/reservation` で登録された予約が表示されます。登録したデータはブラウザの localStorage に保存され、同じブラウザであれば再訪時にも利用できます。

## localStorage に保存されるデータ

`manary-local-app-state` というキーに JSON 形式で保存されます。主な内容:

- `adminUsers`: 管理者アカウントの配列
- `currentUserId`: ログイン中のユーザー ID
- `reservations`: 予約データ（患者情報、サービス種別、日時、メモ、ステータス）
- `serviceTypes`: 予約可能なサービス種別（初期値として妊婦健診・産後ケア・乳房ケアを定義）

**リセットしたい場合**はブラウザのデベロッパーツールから localStorage の該当キーを削除するか、ダッシュボードのコードに用意されている `resetState` 関数を呼び出してください。

## AWS Amplify へのデプロイ

以下は概要です。詳細なスクリーンショット付き手順や運用時の注意点は [`AMPLIFY_SETUP.md`](./AMPLIFY_SETUP.md) を参照してください。

1. **GitHub リポジトリを Amplify に接続**
   - AWS コンソールで Amplify Hosting を開き、「Deploy without Git」または「Deploy from GitHub」を選択。
   - GitHub 連携を有効化してリポジトリとブランチを選択します。
2. **ビルド設定**
   - Build コマンド: `pnpm install && pnpm build`
   - Start コマンドは不要です（Amplify が自動で静的出力を配信）。
   - 環境変数は不要です。
3. **バックエンド設定**
   - この構成ではデータベースを使用しないため、Amplify Backend Environment の追加は不要です。
4. **カスタムドメインや HTTPS**
   - Amplify の画面から任意で設定できます。

### Amplify CLI を使ったデプロイの例

```bash
npm install -g @aws-amplify/cli
amplify configure           # 初回のみ。IAM ユーザーを作成して認証情報を設定
amplify init                # プロジェクトの初期化（Hosting のみ選択）
amplify add hosting         # Amplify Hosting を追加（Continuous deployment with GitHub 等）
amplify publish             # ホスティングにデプロイ
```

※ localStorage を利用しているため、ブラウザごと・端末ごとに保存内容が異なります。Amplify へデプロイした後もデータはユーザーのブラウザにのみ保存され、クラウドには送信されません。

## カスタマイズのヒント

- `components/providers/app-state-provider.tsx` を編集すると、localStorage に保存する内容や初期データを変更できます。
- サービス種別の追加・削除は同ファイルの `defaultServiceTypes` を変更してください。
- 管理者アカウントを初期状態で複数登録したい場合は `defaultAdmin` 配列を編集します。

## ライセンス

このプロジェクトの元コンテンツは MIT ライセンスで公開されています。詳細は `LICENSE` を参照してください。
