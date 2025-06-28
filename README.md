# Manary - 助産院予約管理システム

Manaryは、助産院やクリニック向けの予約管理・顧客管理システムです。管理者向けのダッシュボードと、顧客（患者）向けの予約・問診票提出機能を提供します。

[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

## 目次

- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [プロジェクト構成](#プロジェクト構成)
- [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
  - [前提条件](#前提条件)
  - [インストールと設定](#インストールと設定)
  - [Supabaseのセットアップ](#supabaseのセットアップ)
  - [Twilioのセットアップ](#twilioのセットアップ)
- [主要なコンセプト](#主要なコンセプト)
  - [認証](#認証)
  - [Server Actions](#server-actions)
  - [CSRF保護](#csrf保護)
  - [予約スケジューリング](#予約スケジューリング)
- [デプロイ](#デプロイ)
- [ライセンス](#ライセンス)

## 主な機能

### 管理者向け機能
- **ダッシュボード**: 予約状況の概要を確認できます。
- **予約管理**: 全ての予約をカレンダー形式またはリスト形式で表示・編集・新規作成できます。
- **スケジュール設定**: 助産院、診療種別、予約可能時間（曜日ごと・特定日）を管理できます。
- **ユーザー管理**: 管理者ユーザーの追加・一覧表示が可能です。
- **メッセージ管理**: （将来的な機能）

### 顧客（患者）向け機能
- **新規予約**: 空き状況を確認しながらオンラインで予約できます。
- **予約確認・管理**: SMS認証を通じて、自身の予約を確認・変更・キャンセルできます。
- **問診票**: オンラインで問診票を提出できます。

## 技術スタック

- **フレームワーク**: [Next.js (App Router)](https://nextjs.org/)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **データベース & 認証**: [Supabase](https://supabase.com/)
- **SMS通知 & 認証**: [Twilio](https://www.twilio.com/)
- **フォーム管理**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **UIコンポーネント**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/guide/packages/lucide-react) (Icons)
- **カレンダー**: [React Big Calendar](http://jquense.github.io/react-big-calendar/), [React Day Picker](https://react-day-picker.js.org/)

## プロジェクト構成

\`\`\`
manary/
├── app/                      # Next.js App Router
│   ├── (admin)/              # 管理者向けページ（認証必須）
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── (public)/             # 公開ページ
│   │   ├── reservation/
│   │   └── page.tsx
│   ├── actions/              # Server Actions
│   ├── api/                  # API Routes
│   └── layout.tsx            # ルートレイアウト
├── components/               # 再利用可能なReactコンポーネント
│   ├── ui/                   # shadcn/ui コンポーネント
│   └── *.tsx                 # アプリケーション固有のコンポーネント
├── lib/                      # ライブラリ、ヘルパー関数
│   ├── supabase/             # Supabaseクライアント、型定義
│   ├── csrf.ts               # CSRF保護ロジック
│   └── twilio.ts             # Twilio連携ロジック
├── public/                   # 静的ファイル（画像など）
├── styles/                   # グローバルCSS
├── middleware.ts             # 認証ミドルウェア
└── next.config.mjs           # Next.js設定ファイル
\`\`\`

## ローカル開発環境のセットアップ

### 前提条件
- [Node.js](https://nodejs.org/) (v18以降)
- [pnpm](https://pnpm.io/installation) (推奨)
- [Supabase](https://supabase.com/) アカウント
- [Twilio](https://www.twilio.com/) アカウント

### インストールと設定

1.  **リポジトリをクローン**
    \`\`\`bash
    git clone https://github.com/your-username/manary.git
    cd manary
    \`\`\`

2.  **依存関係をインストール**
    \`\`\`bash
    pnpm install
    \`\`\`

3.  **環境変数を設定**
    プロジェクトルートに `.env.local` ファイルを作成し、以下の内容をコピーして、自身の値に書き換えてください。

    \`\`\`env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL= # SupabaseプロジェクトのURL
    NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabaseプロジェクトのanon key
    SUPABASE_SERVICE_ROLE_KEY= # Supabaseプロジェクトのservice_role key

    # Twilio
    TWILIO_ACCOUNT_SID= # TwilioのAccount SID
    TWILIO_AUTH_TOKEN= # TwilioのAuth Token
    TWILIO_VERIFY_SERVICE_SID= # Twilio VerifyサービスのSID
    TWILIO_PHONE_NUMBER= # Twilioで購入した電話番号

    # Application
    NEXT_PUBLIC_BASE_URL=http://localhost:3000 # アプリケーションのベースURL
    MOCK_SMS=true # trueにするとSMSを実際には送信せず、コンソールに出力します
    \`\`\`

4.  **開発サーバーを起動**
    \`\`\`bash
    pnpm dev
    \`\`\`
    ブラウザで `http://localhost:3000` を開きます。

### Supabaseのセットアップ

1.  **Supabaseプロジェクトを作成**
    [Supabase公式サイト](https://supabase.com/)で新しいプロジェクトを作成します。

2.  **データベーススキーマを設定**
    Supabaseダッシュボードの `SQL Editor` で、プロジェクトに必要なテーブルを作成します。以下のSQLを実行してください。（これは基本的な構造です。詳細は `lib/supabase/database.types.ts` を参照してください）

    \`\`\`sql
    -- clinics, service_types, availability_settings, appointments, questionnaires, users テーブルを作成
    -- 詳細はプロジェクト内の `SUPABASE_SETUP.md` や型定義ファイルを参照してください。
    -- 例: clinics テーブル
    CREATE TABLE clinics (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    \`\`\`
    **注**: 完全なスキーマ設定については、プロジェクト内の `SUPABASE_SETUP.md` を参照してください。

3.  **認証設定**
    - Supabaseダッシュボード > `Authentication` > `URL Configuration` に移動します。
    - **Site URL**: `http://localhost:3000`
    - **Redirect URLs**:
      - `http://localhost:3000/auth/callback`
      - `http://localhost:3000/update-password`

4.  **管理者ユーザーを作成**
    - Supabaseダッシュボード > `Authentication` > `Users` に移動し、「Add User」から管理者用のユーザーを作成します。
    - `Database` > `Table editor` で `users` テーブル（または `profiles` テーブル）を開き、作成したユーザーの `role` を `admin` に設定します。

### Twilioのセットアップ

1.  **Twilioアカウントを作成**
    [Twilio公式サイト](https://www.twilio.com/)でアカウントを作成します。

2.  **電話番号を取得**
    SMSが送信可能な電話番号をTwilioコンソールから購入します。

3.  **APIキーを取得**
    - `Account SID` と `Auth Token` をTwilioコンソールから取得し、`.env.local` に設定します。

4.  **Verifyサービスを作成**
    - `Verify` > `Services` に移動し、新しいサービスを作成します。
    - 作成したサービスの `Service SID` を取得し、`.env.local` の `TWILIO_VERIFY_SERVICE_SID` に設定します。

## 主要なコンセプト

### 認証
- **管理者認証**: メールアドレスとパスワードによる認証。Supabase Authを利用し、セッションはHTTPOnlyのCookieで管理されます。
- **顧客認証**: 電話番号（SMS）による認証。予約管理ページへのアクセス時にTwilio Verifyを利用して本人確認を行います。

### Server Actions
データ作成・更新・削除などのミューテーション処理は、主にNext.jsのServer Actionsを利用しています。これにより、APIエンドポイントを別途作成することなく、サーバーサイドのロジックをフォームから直接呼び出すことができます。CSRF保護も組み込まれています。

### CSRF保護
全てのPOSTリクエスト（Server Actions）は、カスタムのCSRF保護メカニズムによって保護されています。
- `lib/csrf.ts`: HMACベースのトークンを生成・検証します。
- `components/csrf-form.tsx`: CSRFトークンを含むフォームを簡単に作成するためのコンポーネントです。

### 予約スケジューリング
予約の空き状況は、以下のロジックで動的に計算されます。
1.  `availability_settings` テーブルに、曜日ごとの基本スケジュールと、特定日の特別スケジュール（休診日など）を登録します。
2.  ユーザーが日付を選択すると、その日の設定（特定日設定が優先）に基づいて予約可能な時間枠のリストが生成されます。
3.  `appointments` テーブルから既存の予約を取得し、既に埋まっている時間枠を除外します。
4.  最終的に利用可能な時間枠がユーザーに表示されます。

## デプロイ

このプロジェクトはVercelへのデプロイに最適化されています。

1.  **リポジトリをGitHubにプッシュ**
2.  **Vercelプロジェクトを作成**
    - Vercelダッシュボードから、GitHubリポジトリをインポートして新しいプロジェクトを作成します。
    - フレームワークプリセットとして `Next.js` が自動的に選択されます。
3.  **環境変数を設定**
    - Vercelプロジェクトの `Settings` > `Environment Variables` で、`.env.local` と同じ内容の環境変数を設定します。
    - **重要**: `NEXT_PUBLIC_BASE_URL` は、Vercelによって割り当てられた本番ドメイン（例: `https://your-project.vercel.app`）に設定してください。
    - `MOCK_SMS` は `false` に設定するか、変数を削除して本番環境では実際にSMSが送信されるようにします。
4.  **SupabaseのURL設定を更新**
    - Supabaseダッシュボードの `Authentication` > `URL Configuration` で、Site URLとRedirect URLsを本番ドメインに更新・追加します。
    - **Site URL**: `https://your-project.vercel.app`
    - **Redirect URLs**:
      - `https://your-project.vercel.app/auth/callback`
      - `https://your-project.vercel.app/update-password`

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。
