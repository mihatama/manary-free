import type { NextAuthOptions } from "next-auth"
import Cognito from "next-auth/providers/cognito"

const clientId = process.env.COGNITO_CLIENT_ID
const clientSecret = process.env.COGNITO_CLIENT_SECRET
const region = process.env.COGNITO_REGION
const userPoolId = process.env.COGNITO_USER_POOL_ID
const issuer = process.env.COGNITO_ISSUER
const baseDomain = process.env.COGNITO_DOMAIN

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const resolvedRegion = assertEnv(region, "COGNITO_REGION")
const resolvedClientId = assertEnv(clientId, "COGNITO_CLIENT_ID")
const resolvedClientSecret = assertEnv(clientSecret, "COGNITO_CLIENT_SECRET")
const resolvedUserPoolId = assertEnv(userPoolId, "COGNITO_USER_POOL_ID")

const resolvedIssuer =
  issuer ??
  `https://cognito-idp.${resolvedRegion}.amazonaws.com/${resolvedUserPoolId}`

export const authOptions: NextAuthOptions = {
  providers: [
    Cognito({
      clientId: resolvedClientId,
      clientSecret: resolvedClientSecret,
      issuer: resolvedIssuer,
      // Hosted UI domain can be inferred from issuer, but allowing override for custom domains
      wellKnown:
        baseDomain?.endsWith("/.well-known/openid-configuration") === true
          ? baseDomain
          : baseDomain
            ? `${baseDomain.replace(/\/$/, "")}/.well-known/openid-configuration`
            : undefined,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl
    },
  },
}
