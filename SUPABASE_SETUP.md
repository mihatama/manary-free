# Supabase設定ガイド

このドキュメントでは、Manary管理システムのSupabase設定について説明します。

## 1. Supabase認証設定

Vercel環境で正しく動作させるためには、Supabaseダッシュボードで以下の設定が必要です：

### 認証リダイレクトURL

Supabaseダッシュボード > Authentication > URL Configuration で以下のURLを追加してください：

- `https://[あなたのVercelドメイン]/auth/callback`
- `https://[あなたのVercelドメイン]/update-password`

### サイトURL

Supabaseダッシュボード > Authentication > URL Configuration で「Site URL」を設定してください：

- `https://[あなたのVercelドメイン]`

## 2. 管理者ユーザーの作成

Supabaseダッシュボードから管理者ユーザーを作成する手順：

1. Supabaseダッシュボード > Authentication > Users に移動
2. 「Add User」をクリック
3. メールアドレスを入力し、強力なパスワードを設定してください（パスワードは12文字以上で、大文字、小文字、数字、特殊文字を含めることを推奨）
4. ユーザーが作成されたら、Database > Table editor に移動
5. 「profiles」テーブルを選択
6. 作成したユーザーのレコードを見つけて、「role」フィールドを「admin」に更新

## 3. 環境変数の設定

Vercelダッシュボードで以下の環境変数が正しく設定されていることを確認してください：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4. トラブルシューティング

認証に問題がある場合は、以下を確認してください：

1. ブラウザのCookieが有効になっていること
2. Supabaseの認証リダイレクトURLが正しく設定されていること
3. 環境変数が正しく設定されていること
