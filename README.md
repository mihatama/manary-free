# Manary - Amplify Local Storage Edition

Manary is a reservation and client-management app tailored for midwifery clinics. This edition keeps all reservation data inside the browser via `localStorage`, while administrator authentication is delegated to Amazon Cognito. The front end is built with Next.js (App Router) and deploys cleanly to AWS Amplify Hosting.

## Highlights

- **Cognito sign-in** - Administrators authenticate through the Cognito Hosted UI, powered by NextAuth.js.
- **Local data storage** - Reservations and service definitions live in the browser under the `manary-local-app-state` key; no database or backend is required.
- **Dashboard tooling** - `/dashboard` exposes counts, status changes, and deletion controls for every reservation.
- **Public reservation form** - `/reservation` allows clients to submit bookings that instantly appear on the dashboard.
- **Amplify friendly** - Static output (`out/`) is ready for Amplify Hosting with no extra build scripting.

## Tech Stack

- Next.js 15 (App Router) + React 19
- NextAuth.js 5 beta with Cognito provider
- Tailwind CSS + shadcn/ui
- TypeScript 5

## Directory Layout

```
manary-free/
├── app/
│   ├── api/auth/[...nextauth]/   # NextAuth route handler (Cognito)
│   ├── dashboard/                # Admin dashboard
│   ├── reservation/              # Public reservation form
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Landing page + Cognito login CTA
├── components/
│   ├── providers/                # Session + local state providers
│   ├── login-form.tsx            # Cognito sign-in card
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # NextAuth options (Cognito)
│   ├── csrf.ts                   # CSRF helpers (reserved for future APIs)
│   └── utils.ts                  # Tailwind utility helpers
└── public/                       # Static assets
```

## Local Development

```bash
pnpm install
pnpm dev
# visit http://localhost:3000
```

Create a `.env.local` with the variables listed below before starting the dev server.

### Required Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `COGNITO_CLIENT_ID` | ✅ | Cognito user-pool app client ID |
| `COGNITO_CLIENT_SECRET` | ✅ | Cognito app client secret |
| `COGNITO_REGION` | ✅ | Region, for example `ap-northeast-1` |
| `COGNITO_USER_POOL_ID` | ✅ | User pool ID, for example `ap-northeast-1_XXXXXXXXX` |
| `COGNITO_DOMAIN` | Optional | Hosted UI domain such as `https://example.auth.ap-northeast-1.amazoncognito.com` or your custom domain |
| `COGNITO_ISSUER` | Optional | Overrides the inferred issuer URL (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>`) |
| `NEXTAUTH_SECRET` | ✅ | Random string for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ (prod) | Public site URL, e.g. `https://yourapp.amplifyapp.com` |

> Tip: if you supply `COGNITO_DOMAIN`, the app derives the `.well-known/openid-configuration` endpoint automatically. When omitted, the issuer derived from region + user-pool ID is used.

### Cognito Hosted UI Checklist

1. **App client** – Create a web app client (secret enabled) in the Cognito user pool.
2. **Callback URLs** – Add `http://localhost:3000/api/auth/callback/cognito` for local testing (and the Amplify URL for production).
3. **Sign-out URLs** – Add `http://localhost:3000` (and your production URL).
4. **OAuth flows / scopes** – Enable `code` flow, scopes `openid`, `email`, `profile`.
5. **Domain** – Reserve an AWS-hosted or custom domain for the Hosted UI.

### Sign-in Flow Summary

1. `/` displays the Cognito CTA.
2. Clicking the button calls `signIn("cognito")` and redirects to Hosted UI.
3. After Cognito authentication, the user lands on `/dashboard`.
4. Selecting “Sign out” triggers Cognito logout and returns to `/`.

### Local Storage Schema

Data lives under `localStorage["manary-local-app-state"]` and looks like:

```json
{
  "reservations": [
    {
      "id": "uuid",
      "patientName": "Jane Doe",
      "patientEmail": "sample@example.com",
      "serviceTypeId": "prenatal",
      "status": "pending"
    }
  ],
  "serviceTypes": [
    { "id": "prenatal", "name": "Prenatal check-up", "durationMinutes": 60 }
  ]
}
```

Use your browser dev tools to clear this key or call the `resetState` helper inside the dashboard if you need to reset the demo data.

## Amplify Hosting Deployment

1. Connect the repository in Amplify Hosting (GitHub or manual).
2. Build settings:
   ```bash
   pnpm install
   pnpm build
   ```
   Output directory: `out`
3. Configure the environment variables above for every target branch.
4. After deployment, update Cognito callback/sign-out URLs to match the Amplify domain.

### Manual Publish (Amplify CLI)

```bash
npm install -g @aws-amplify/cli
amplify configure
amplify init            # choose Hosting: Manual deployment
pnpm install && pnpm build
amplify publish         # uploads the ./out directory
```

## Troubleshooting

- **Configuration error at sign-in** – Confirm all Cognito env vars (`COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_REGION`, `COGNITO_USER_POOL_ID`) plus `NEXTAUTH_SECRET` are set in Amplify, and that Cognito callback URLs match your site.
- **Data missing after refresh** – Ensure your browser allows localStorage for the domain. Each browser/device stores an isolated copy of the reservations.
- **Need more admins?** – Add users directly in the Cognito user pool; no code changes are required.

---

Feel free to raise an issue if you spot a bug or need enhancements.
