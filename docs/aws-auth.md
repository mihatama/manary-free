# AWSでのログイン認証の推奨サービス

## 要件の整理

- 既存の登録ユーザーだけがログインできるようにする
- SMS を利用した二段階認証は不要
- Next.js（App Router）ベースの本アプリケーションに統合したい

## 推奨サービス: Amazon Cognito ユーザープール

Amazon Cognito の **ユーザープール** は、アプリケーションユーザーのサインアップ／サインイン、パスワードリセット、アクセストークンの発行を担うマネージド型 ID プロバイダーです。メールアドレスやパスワードを用いたシンプルな認証を標準機能で提供し、SMS を伴わない認証フローもサポートしています。

### 選定理由

- **ユーザー管理の容易さ**: Cognito がユーザープロファイルと認証フローを管理するため、アプリ側でパスワードハッシュやトークン管理を実装する必要がありません。
- **メールベースの認証**: 確認コードの送信先をメールに限定できるため、SMS を利用しない構成が可能です。MFA が不要であれば無効化できます。
- **Amplify UI / AWS SDK との統合**: 本プロジェクトで採用している AWS Amplify UI コンポーネントや `aws-amplify` ライブラリを使用すると、Next.js から Cognito を比較的容易に扱えます。
- **セキュリティと拡張性**: OpenID Connect や SAML などのフェデレーション連携も利用できるため、将来的な拡張が容易です。

### 実装の概要（Next.js アプリ統合）

1. **Cognito ユーザープールを作成**
   - サインインオプションで「メールアドレス」を選択します。
   - サインアップフローを無効化するか、管理者のみに制限することで「登録済みユーザーのみログイン」を実現できます。
2. **アプリクライアントを設定**
   - SPA 用のクライアントを作成し、PKCE を有効化します。
   - 許可されたコールバック URL、ログアウト URL、`openid` や `profile` などの必要なスコープを登録します。
3. **Next.js との連携**
   - `aws-amplify` を使って Cognito User Pool と Hosted UI（任意）を設定します。
   - 既存の Supabase 認証ロジックから移行する場合は、`lib/supabase` 配下のクライアント利用箇所を Cognito 連携コードに置き換えます。
   - Amplify UI の `<Authenticator>` コンポーネントを使用すると、メールアドレス + パスワードでのサインインフォームを即座に利用できます。

### Next.js アプリで Hosted UI を利用する際の環境変数

Next.js の `app` ディレクトリでは、Cognito Hosted UI を使った OpenID Connect フローを `/api/auth/authorize` → `/api/auth/callback` → `/api/auth/logout` で実装しています。以下の環境変数を `.env` に設定してください。

| 変数名 | 説明 |
| --- | --- |
| `COGNITO_REGION` | ユーザープールのリージョン（例: `ap-northeast-1`） |
| `COGNITO_CLIENT_ID` | アプリクライアント ID |
| `COGNITO_CLIENT_SECRET` | アプリクライアントシークレット |
| `COGNITO_ISSUER_URL` または `COGNITO_USER_POOL_ID` | `https://cognito-idp.<region>.amazonaws.com/<userPoolId>` 形式の Issuer URL。Issuer を直接設定しない場合は `COGNITO_USER_POOL_ID` を指定してください。|
| `COGNITO_HOSTED_UI_DOMAIN` | Hosted UI ドメイン（例: `https://your-domain.auth.ap-northeast-1.amazoncognito.com`） |
| `COGNITO_REDIRECT_URI` | Cognito から戻るコールバック URL（例: `https://example.com/api/auth/callback`） |
| `COGNITO_LOGOUT_REDIRECT_URI` | Hosted UI ログアウト後のリダイレクト先（例: `https://example.com/`）。未設定の場合は `COGNITO_REDIRECT_URI` が利用されます。|
| `COGNITO_SCOPES` (任意) | `openid email phone` などのスコープをスペース区切りまたはカンマ区切りで指定 |

すべての値が正しく設定されると、ログインボタンから Hosted UI に遷移し、トークンが `cognitoAccessToken` などの HTTP-only Cookie に保存されます。ログアウトボタンは Hosted UI の `/logout` エンドポイントへリダイレクトし、トークン Cookie を破棄します。
4. **管理者がユーザーを登録**
   - Cognito コンソール、または管理用バックエンドから `AdminCreateUser` API を呼び出し、事前にユーザーを登録します。
   - 初回ログイン時にユーザーにパスワード設定を促すワークフローを利用できます。

### Node.js（Express）から Hosted UI による OIDC 認証を行う場合の手順

Next.js では Amplify Auth を直接利用できますが、バックエンド管理ツールや単体の Node.js アプリから Cognito の Hosted UI にリダイレクトさせたいケースもあります。その場合は次のように `openid-client` を利用したシンプルな Express 実装を参考にしてください。

1. **前提条件**
   - Node.js は 20 以上を使用します。
   - Cognito ユーザープールで Hosted UI を有効化し、リダイレクト URI・ログアウト URI・スコープ（例: `openid`, `email`, `profile`）を設定済みであること。
2. **依存関係を準備**
   - `package.json` に以下のような依存関係を定義します。

     ```json
     {
       "name": "node",
       "version": "1.0.0",
       "main": "app.js",
       "scripts": {
         "start": "node app.js"
       },
       "dependencies": {
         "ejs": "^3.1.10",
         "express": "^4.21.1",
         "express-session": "^1.18.1",
         "openid-client": "^5.7.0"
       }
     }
     ```

   - `npm install` で依存関係をインストールします。
3. **Express アプリを構築**
   - `openid-client` を Cognito の OIDC 発行者情報で初期化し、セッションを用いて状態管理を行います。

     ```javascript
     const express = require('express');
     const session = require('express-session');
     const { Issuer, generators } = require('openid-client');

     const app = express();
     let client;

     async function initializeClient() {
       const issuer = await Issuer.discover('https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_example');
       client = new issuer.Client({
         client_id: 'yourClientId',
         client_secret: 'yourClientSecret',
         redirect_uris: ['https://your-app.example.com/callback'],
         response_types: ['code']
       });
     }

     initializeClient().catch(console.error);

     app.use(session({
       secret: process.env.SESSION_SECRET,
       resave: false,
       saveUninitialized: false
     }));
     ```

   - 認証状態を判定するミドルウェアとルートを実装します。

     ```javascript
     const checkAuth = (req, res, next) => {
       req.isAuthenticated = Boolean(req.session.userInfo);
       next();
     };

     app.set('view engine', 'ejs');

     app.get('/', checkAuth, (req, res) => {
       res.render('home', {
         isAuthenticated: req.isAuthenticated,
         userInfo: req.session.userInfo
       });
     });

     app.get('/login', (req, res) => {
       const nonce = generators.nonce();
       const state = generators.state();

       req.session.nonce = nonce;
       req.session.state = state;

       const authUrl = client.authorizationUrl({
         scope: 'openid email profile',
         state,
         nonce
       });

       res.redirect(authUrl);
     });
     ```

   - Hosted UI からのコールバックを処理し、ユーザー情報をセッションに保存します。

     ```javascript
     app.get('/callback', async (req, res) => {
       try {
         const params = client.callbackParams(req);
         const tokenSet = await client.callback(
           'https://your-app.example.com/callback',
           params,
           {
             nonce: req.session.nonce,
             state: req.session.state
           }
         );

         const userInfo = await client.userinfo(tokenSet.access_token);
         req.session.userInfo = userInfo;

         res.redirect('/');
       } catch (error) {
         console.error('Callback error:', error);
         res.redirect('/');
       }
     });
     ```

   - ログアウト時はセッションを破棄し、Cognito の Hosted UI ログアウトエンドポイントへリダイレクトします。

     ```javascript
     app.get('/logout', (req, res) => {
       req.session.destroy(() => {
         const logoutUrl = 'https://your-user-pool-domain/logout' +
           `?client_id=yourClientId&logout_uri=${encodeURIComponent('https://your-app.example.com/')}`;
         res.redirect(logoutUrl);
       });
     });

     app.listen(3000, () => {
       console.log('Server running on http://localhost:3000');
     });
     ```

4. **ビューを用意**
   - `views/home.ejs` などでサインイン／サインアウトリンクとユーザー情報を表示します。

     ```html
     <!DOCTYPE html>
     <html>
       <head>
         <meta charset="utf-8" />
         <title>Amazon Cognito authentication with Node example</title>
       </head>
       <body>
         <h1>Amazon Cognito User Pool Demo</h1>
         <% if (isAuthenticated) { %>
           <p>Welcome, <%= userInfo.username || userInfo.email %></p>
           <pre><%= JSON.stringify(userInfo, null, 2) %></pre>
           <a href="/logout">Logout</a>
         <% } else { %>
           <p>Please log in to continue</p>
           <a href="/login">Login</a>
         <% } %>
       </body>
     </html>
     ```

この流れにより、Cognito ユーザープールで事前登録されたユーザーのみがメールアドレスとパスワードでログインできるホスト型 UI 連携を実現できます。Next.js 側で Amplify を用いる場合も同様に、許可されたリダイレクト URI とスコープを正しく設定することが重要です。

### 参考情報

- [Amazon Cognito ユーザープールの概要](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Amplify Auth（React）ドキュメント](https://docs.amplify.aws/react/build-a-backend/auth/)

## 補足: 代替案の検討

- **AWS IAM Identity Center (旧 AWS SSO)**: 社内の従業員向け SSO には便利ですが、外部利用者を想定したカスタムアプリのサインイン用途ではオーバーキルになる場合があります。
- **Amazon Verified Permissions や AppSync**: 認可や API 層の制御は別途構築可能ですが、基本的なユーザー認証には Cognito が最もシンプルです。

上記の通り、メールアドレスとパスワードによる認証で「登録者のみログイン」を実現したい場合、Amazon Cognito ユーザープールが最適な選択肢となります。
