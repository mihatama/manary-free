# AWS Amplify Setup Guide

This guide walks through deploying `manary-free` (the local-storage edition of Manary) to AWS Amplify Hosting and wiring Amplify Auth (Amazon Cognito) for administrator sign-in. No external database is required; charts remain in the user’s browser `localStorage` and are encrypted while a subscription is active.

---

## Prerequisites
- AWS account with permission to use Amplify Hosting and Cognito.
- Node.js 18.18+ (or 20+) with npm installed.
- Amplify CLI (Gen 2) installed globally:
  ```bash
  npm install -g @aws-amplify/cli
  ```

---

## 1. Clone the repository
```bash
git clone https://github.com/mihatama/manary-free.git
cd manary-free
npm install
```

> The repo ships with a placeholder `amplify_outputs.json`. Replace it after you finish the Amplify setup below.

---

## 2. Provision the Amplify backend
Follow [Build a backend > Auth](https://docs.amplify.aws/react/build-a-backend/auth/) and run the commands in this order:

1. **Initialize Amplify**
   ```bash
   amplify init
   ```
   - Framework: **JavaScript / React**
   - Environment name: choose anything (for example `dev`)

2. **Add authentication**
   ```bash
   amplify add auth
   ```
   - Choose **Default configuration** to create a Cognito User Pool automatically
   - Pick `Email` or `Username` as the primary sign-in field (can be adjusted later)

3. **Deploy the backend**
   ```bash
   amplify push
   ```
   - This provisions the Cognito User Pool and app clients

4. **Pull generated outputs for the frontend**
   ```bash
   amplify pull --appId <amplify-app-id> --envName <env>
   ```
   - Alternatively accept the prompt shown after `amplify push`
   - This refreshes `amplify_outputs.json` with the new resources

> If you can safely commit `amplify_outputs.json`, do so. Otherwise inject it in your CI/CD build (for example with SSM Parameter Store or Amplify Hosting environment variables).

---

## 3. Configure environment variables
Create `.env.local` (and matching production secrets) with at least:

```bash
NEXT_PUBLIC_UNLOCK_CODE=PROD-UNLOCK-XYZ
# Optional billing backend
# BILLING_SERVICE_URL=https://billing.example.com/api
# BILLING_SERVICE_API_KEY=sk_live_...
```

- `NEXT_PUBLIC_UNLOCK_CODE` seals the client-side encryption key and unlocks the dashboard after payment.
- If you supply `BILLING_SERVICE_URL`, the app will POST to `/subscriptions/verify` on that service; otherwise it uses the local fixture in `data/subscriptions-dev.json` (development only).

---

## 4. Run locally
```bash
npm run dev
# open http://localhost:3000
```

- `/` shows the Amplify Auth `Authenticator` UI. Signing in redirects to `/dashboard`.
- Chart data is encrypted and stored in `localStorage["manary-free-charts-state"]`. When billing lapses the encryption key is discarded until payment resumes.

---

## 5. Deploy to Amplify Hosting

### Git-connected workflow
1. Connect the repository in Amplify Hosting.
2. Set build commands:
   ```bash
   npm install
   npm run build
   ```
   Output directory: `out`
3. Provide environment variables (`NEXT_PUBLIC_UNLOCK_CODE`, billing settings, etc.) and ensure `amplify_outputs.json` is present during build.
4. Deploy and verify the generated domain.

### Manual publish via Amplify CLI
```bash
npm run build            # generates ./out
amplify publish          # uploads to Amplify Hosting (S3 + CloudFront)
```

---

## 6. Operations checklist
- Manage administrators in the Cognito User Pool created by Amplify Auth.
- To reset charts on a machine, delete `localStorage["manary-free-charts-state"]` and `localStorage["manary-free-subscription-state"]` in the browser dev tools.
- Keep `NEXT_PUBLIC_UNLOCK_CODE` in sync with whatever code your billing backend issues to customers.
- If you use the fallback fixture, remove or replace `data/subscriptions-dev.json` for production builds.

---

For UI customization details, visit the [Amplify UI Authenticator documentation](https://ui.docs.amplify.aws/react/connected-components/authenticator). Open an issue if you hit any snags or have improvement ideas.
