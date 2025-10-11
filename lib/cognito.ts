const REGION =
  process.env.COGNITO_REGION ??
  process.env.NEXT_PUBLIC_COGNITO_REGION ??
  process.env.AWS_REGION ??
  process.env.AWS_DEFAULT_REGION ??
  null

const CLIENT_ID =
  process.env.COGNITO_CLIENT_ID ??
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ??
  process.env.AWS_COGNITO_CLIENT_ID ??
  null

const CLIENT_SECRET =
  process.env.COGNITO_CLIENT_SECRET ??
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET ??
  process.env.AWS_COGNITO_CLIENT_SECRET ??
  null

export type CognitoConfig = {
  region: string
  clientId: string
  clientSecret: string
}

export function getCognitoConfig(): CognitoConfig | null {
  if (!REGION || !CLIENT_ID || !CLIENT_SECRET) {
    return null
  }

  return {
    region: REGION,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  }
}

export function getMissingCognitoConfig(): string[] {
  const missing: string[] = []

  if (!REGION) {
    missing.push("COGNITO_REGION")
  }

  if (!CLIENT_ID) {
    missing.push("COGNITO_CLIENT_ID")
  }

  if (!CLIENT_SECRET) {
    missing.push("COGNITO_CLIENT_SECRET")
  }

  return missing
}
