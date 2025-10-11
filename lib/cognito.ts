const DEFAULT_SCOPES = ["openid", "email", "phone"] as const

function resolveRegion() {
  return (
    process.env.COGNITO_REGION ??
    process.env.NEXT_PUBLIC_COGNITO_REGION ??
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    null
  )
}

function resolveClientId() {
  return (
    process.env.COGNITO_CLIENT_ID ??
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ??
    process.env.AWS_COGNITO_CLIENT_ID ??
    null
  )
}

function resolveClientSecret() {
  return (
    process.env.COGNITO_CLIENT_SECRET ??
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET ??
    process.env.AWS_COGNITO_CLIENT_SECRET ??
    null
  )
}

function resolveIssuerUrl() {
  const directIssuer =
    process.env.COGNITO_ISSUER_URL ?? process.env.NEXT_PUBLIC_COGNITO_ISSUER_URL ?? null

  if (directIssuer) {
    return directIssuer
  }

  const region = resolveRegion()
  const userPoolId = process.env.COGNITO_USER_POOL_ID ?? null

  if (region && userPoolId) {
    return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
  }

  return null
}

function resolveHostedDomain() {
  return (
    process.env.COGNITO_HOSTED_UI_DOMAIN ??
    process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI_DOMAIN ??
    null
  )
}

function resolveRedirectUri() {
  return (
    process.env.COGNITO_REDIRECT_URI ??
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ??
    null
  )
}

function resolveLogoutRedirectUri() {
  return (
    process.env.COGNITO_LOGOUT_REDIRECT_URI ??
    process.env.NEXT_PUBLIC_COGNITO_LOGOUT_REDIRECT_URI ??
    resolveRedirectUri() ??
    null
  )
}

function resolveScopes() {
  const scopesEnv = process.env.COGNITO_SCOPES ?? process.env.NEXT_PUBLIC_COGNITO_SCOPES ?? null

  if (!scopesEnv) {
    return [...DEFAULT_SCOPES]
  }

  return scopesEnv
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0)
}

export type CognitoConfig = {
  region: string
  clientId: string
  clientSecret: string
}

export type CognitoOidcConfig = CognitoConfig & {
  issuerUrl: string
  hostedDomain: string
  redirectUri: string
  logoutRedirectUri: string
  scopes: string[]
}

export function getCognitoConfig(): CognitoConfig | null {
  const region = resolveRegion()
  const clientId = resolveClientId()
  const clientSecret = resolveClientSecret()

  if (!region || !clientId || !clientSecret) {
    return null
  }

  return {
    region,
    clientId,
    clientSecret,
  }
}

export function getCognitoOidcConfig(): CognitoOidcConfig | null {
  const baseConfig = getCognitoConfig()
  if (!baseConfig) {
    return null
  }

  const issuerUrl = resolveIssuerUrl()
  const hostedDomain = resolveHostedDomain()
  const redirectUri = resolveRedirectUri()
  const logoutRedirectUri = resolveLogoutRedirectUri()
  const scopes = resolveScopes()

  if (!issuerUrl || !hostedDomain || !redirectUri || !logoutRedirectUri) {
    return null
  }

  return {
    ...baseConfig,
    issuerUrl,
    hostedDomain,
    redirectUri,
    logoutRedirectUri,
    scopes,
  }
}

export function getMissingCognitoConfig(): string[] {
  const missing: string[] = []

  if (!resolveRegion()) {
    missing.push("COGNITO_REGION")
  }

  if (!resolveClientId()) {
    missing.push("COGNITO_CLIENT_ID")
  }

  if (!resolveClientSecret()) {
    missing.push("COGNITO_CLIENT_SECRET")
  }

  return missing
}

export function getMissingCognitoOidcConfig(): string[] {
  const missing = getMissingCognitoConfig()

  if (!resolveIssuerUrl()) {
    missing.push("COGNITO_ISSUER_URL")
  }

  if (!resolveHostedDomain()) {
    missing.push("COGNITO_HOSTED_UI_DOMAIN")
  }

  if (!resolveRedirectUri()) {
    missing.push("COGNITO_REDIRECT_URI")
  }

  if (!resolveLogoutRedirectUri()) {
    missing.push("COGNITO_LOGOUT_REDIRECT_URI")
  }

  return missing
}
