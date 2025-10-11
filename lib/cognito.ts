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

export type CognitoConfig = {
  region: string
  clientId: string
  clientSecret: string
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
