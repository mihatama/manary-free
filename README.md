# Manary - 助産院予約管理システム / Clinic Reservation and Management System

Manaryは、助産院やクリニック向けの顧客管理システムです。管理者向けのダッシュボード機能を中心に提供しており、以前存在したオンライン予約や問診票の提出機能は廃止されています。This is an internal-facing web application for managing clinic information and medical records. It is built with Next.js, Supabase, Tailwind CSS, and AWS Amplify UI.

[![Built with AWS Amplify UI](https://img.shields.io/badge/Built%20with-AWS%20Amplify%20UI-orange?style=for-the-badge&logo=aws-amplify)](https://docs.amplify.aws/react/build-a-backend/ui-components/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

## 目次 / Project Overview

- [主な機能](#主な機能) / The application now focuses on internal operations for clinic staff.
- [技術スタック](#技術スタック) / Tech Stack
- [プロジェクト構成](#プロジェクト構成) / Project Structure
- [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ) / Getting Started
- [データベーススキーマ（テーブル構成）](#データベーススキーマテーブル構成) / Database Schema
- [主要なコンセプト](#主要なコンセプト) / Key Concepts
- [カスタマイズ](#カスタマイズ) / Customization
- [デプロイ](#デプロイ) / Deployment
- [ライセンス](#ライセンス) / License

## 主な機能 / Features

### 管理者向け機能 / Admin Dashboard (`/dashboard`)

- **ダッシュボード**: システムの最新情報と主要な案内を確認できます。 / Review high-level information that is relevant to clinic staff.
- **カルテ管理**: 既存のカルテ情報を一覧・検索できます。 / View a summary or detailed medical charts derived from questionnaires.
- **ユーザー管理**: 管理者ユーザーの追加・一覧表示が可能です。 / Manage staff user accounts.
- **メッセージ管理**: 連絡事項を確認できます。 / Review internal messages.
- **一般設定**: クリニック情報や他のアプリケーション設定を管理できます。 / Manage clinic information and other application settings.

### 顧客（患者）向け機能 / Patient-facing Pages

オンライン予約およびオンライン問診票は廃止されました。公開ページでは、機能終了のお知らせのみを表示します。 / The public pages now display a notice explaining that online reservations and questionnaires are no longer available.

## 技術スタック / Tech Stack

- **フレームワーク**: [Next.js (App Router)](https://nextjs.org/)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [AWS Amplify UI](https://ui.docs.amplify.aws/react)
- **データベース & 認証**: [Supabase](https://supabase.com/)
- **SMS通知 & 認証**: [Twilio](https://www.twilio.com/)
- **フォーム管理**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **UIコンポーネント**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/guide/packages/lucide-react) (Icons)
- **カレンダー**: [React Big Calendar](http://jquense.github.io/react-big-calendar/), [React Day Picker](https://react-day-picker.js.org/)

## プロジェクト構成 / Project Structure

\`\`\`
manary/
├── app/                      # Next.js App Router
│   ├── (admin)/              # 管理者向けページ（認証必須）
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── (public)/             # 公開ページ（オンライン予約は廃止済み）
│   │   ├── reservation/
│   │   └── page.tsx
│   ├── actions/              # Server Actions
│   │   ├── reservation-actions.ts
│   │   ├── questionnaire-actions.ts
│   │   └── chart-actions.ts
│   ├── api/                  # API Routes
│   └── layout.tsx            # ルートレイアウト
├── components/               # 再利用可能なReactコンポーネント
│   ├── ui/                   # shadcn/ui コンポーネント
│   └── *.tsx                 # アプリケーション固有のコンポーネント
├── lib/                      # ライブラリ、ヘルパー関数
│   ├── supabase/             # Supabaseクライアント、型定義
│   └── ...
├── public/                   # 静的ファイル（画像など）
├── middleware.ts             # 認証ミドルウェア
└── next.config.mjs           # Next.js設定ファイル
\`\`\`

## ローカル開発環境のセットアップ / Getting Started

### 前提条件 / Prerequisites

- [Node.js](https://nodejs.org/) (v18以降)
- [pnpm](https://pnpm.io/installation) (推奨)
- [Supabase](https://supabase.com/) アカウント
- [Twilio](https://www.twilio.com/) アカウント (オプション、SMS認証用)

### インストールと設定 / Installation

1.  **リポジトリをクローンし、依存関係をインストール** / Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/manary.git
cd manary
npm install
\`\`\`

2.  **環境変数を設定** / Set up environment variables:
プロジェクトルートに `.env.local` ファイルを作成し、自身の値に書き換えてください。 / Create a `.env.local` file in the root of the project and add your Supabase project URL and anon key.
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
COGNITO_REGION=ap-northeast-1
COGNITO_CLIENT_ID=17dfvdao2o2qbmbmmtmhhlqpfl
COGNITO_CLIENT_SECRET=your-cognito-client-secret
# Add other variables like Twilio credentials if needed

> **Note:** Managed hosting providers sometimes only expose variables with the `NEXT_PUBLIC_` prefix.
> If that is your case, set `NEXT_PUBLIC_COGNITO_REGION`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, and `NEXT_PUBLIC_COGNITO_CLIENT_SECRET`.
> The application will fall back to these when the standard server-only variables are missing.
\`\`\`

3.  **開発サーバーを起動** / Run the development server:
\`\`\`bash
npm run dev
\`\`\`
ブラウザで `http://localhost:3000` を開きます。 / Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## データベーススキーマ（テーブル構成） / Database Schema

このプロジェクトのデータベースは、患者情報を独立した `users` テーブルで管理するのではなく、各予約や問診票に直接保存する「非正規化」された構造を特徴としています。以下は主要なテーブルの構成です。 / Based on the application code, the database is expected to have the following main tables.

### `reservations`

予約情報を格納するテーブル。患者情報は `patient_name` などのカラムに直接保存されます。 / Stores information about each patient booking.

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer | 予約の主キー |
| `service_type_id` | integer | `service_types`テーブルへの外部キー |
| `reservation_date` | date | 予約日 |
| `start_time` | time | 開始時刻 |
| `end_time` | time | 終了時刻 |
| `patient_name` | varchar | 患者の氏名 |
| `patient_email` | varchar | 患者のメールアドレス |
| `patient_phone` | varchar | 患者の電話番号 |
| `note` | text | 予約に関する追加のメモ |
| `access_token` | varchar | 予約管理用のユニークなトークン |
| `status` | varchar | 予約ステータス（例: confirmed, cancelled） |
| `created_at` | timestamp with time zone | 作成日時 |
| `updated_at` | timestamp with time zone | 最終更新日時 |

### `questionnaires`

問診票情報を格納するテーブル。カルテ情報もこのテーブルに含まれます。 / Stores detailed medical information submitted by patients.

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer | 問診票の主キー |
| `reservation_id` | integer | `reservations`テーブルへの外部キー |
| `mother_last_name` | varchar | 母親の姓 |
| `mother_first_name` | varchar | 母親の名 |
| `email` | varchar | メールアドレス |
| `phone_number` | varchar | 電話番号 |
| `created_at` | timestamp with time zone | 作成日時 |
| `updated_at` | timestamp with time zone | 最終更新日時 |
| *(...and many other columns for medical history)* | | |

### `service_types`

提供するサービス（診療種別）のマスターテーブル。 / Stores the different types of services offered by the clinic.

| カラム名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer | サービスの主キー |
| `name` | varchar | サービス名（例: 乳房ケア, 産後ケア） |
| `duration` | integer | サービスの所要時間（分） |
| `color` | varchar | カレンダー表示用の色 |
| `...` | | |

## 主要なコンセプト / Key Concepts

### データモデル
このアプリケーションの最大の特徴は、患者情報を正規化せず、`reservations` や `questionnaires` テーブルに直接保存している点です。これにより、独立した `users` テーブルは不要になり、各レコードが自己完結型の情報を持つことになります。コードを書く際は、このデータ構造を常に意識する必要があります。 / This application's primary feature is storing patient information directly in the `reservations` and `questionnaires` tables rather than normalizing it in a separate `users` table. This eliminates the need for an independent `users` table and ensures that each record contains self-contained information. When writing code, always be mindful of this data structure.

### 認証
- **管理者認証**: メールアドレスとパスワードによる認証。Supabase Authを利用します。 / **Admin Authentication**: Uses email and password authentication with Supabase Auth.
- **顧客認証**: 電話番号（SMS）による認証。予約管理ページへのアクセス時にTwilio Verifyを利用します。 / **Patient Authentication**: Uses phone number (SMS) authentication with Twilio Verify for accessing reservation management pages.

### Server Actions
データ作成・更新・削除などの処理は、主にNext.jsのServer Actionsを利用しています。これにより、APIエンドポイントを別途作成することなく、サーバーサイドのロジックを直接呼び出せます。 / Data creation, update, and deletion processes primarily use Next.js Server Actions. This allows for direct invocation of server-side logic without the need to create separate API endpoints.

## カスタマイズ / Customization

### 助産院の作成上限数 / Maximum Number of Clinics
このシステムでは、契約プランに応じて作成できる助産院の数を制限できます。この上限は、開発者がコード内の変数を変更することで設定します。

- **設定ファイル**: `components/clinic-manager.tsx`
- **変数名**: `MAX_CLINICS`

この変数の値を変更することで、管理画面に表示される助産院の登録枠の数を `1` や `3` など、プランに応じた数に調整できます。

\`\`\`typescript
// components/clinic-manager.tsx

// ↓この値を変更することで、作成できる助産院の上限数を設定します
const MAX_CLINICS = 3; // 例: 3件に設定
\`\`\`

This system allows for limiting the number of clinics that can be created based on the subscription plan. This limit is configured by developers by changing a variable in the code.

- **Configuration File**: `components/clinic-manager.tsx`
- **Variable Name**: `MAX_CLINICS`

By changing the value of this variable, you can adjust the number of clinic registration slots displayed on the admin screen to match the plan, such as `1` or `3`.

\`\`\`typescript
// components/clinic-manager.tsx

// ↓ Change this value to set the maximum number of clinics that can be created.
const MAX_CLINICS = 3; // Example: Set to 3
\`\`\`

## デプロイ / Deployment

このプロジェクトはVercelへのデプロイに最適化されています。 / This project is optimized for deployment on Vercel.
1.  リポジトリをGitHubにプッシュします。 / Push the repository to GitHub.
2.  Vercelダッシュボードから、GitHubリポジトリをインポートして新しいプロジェクトを作成します。 / Import the GitHub repository into the Vercel dashboard to create a new project.
3.  Vercelプロジェクトの環境変数を `.env.local` と同じ内容で設定します。`NEXT_PUBLIC_BASE_URL` は本番ドメインに更新してください。 / Set the environment variables for the Vercel project to the same content as `.env.local`. Update `NEXT_PUBLIC_BASE_URL` to your production domain.
4.  Supabaseダッシュボードの認証設定で、Site URLとRedirect URLsを本番ドメインに更新・追加します。 / Update and add Site URL and Redirect URLs in the Supabase dashboard to your production domain.

## ライセンス / License

このプロジェクトは [MIT License](LICENSE) の下で公開されています。 / This project is released under the [MIT License](LICENSE).
