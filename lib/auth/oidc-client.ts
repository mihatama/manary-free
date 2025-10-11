import { Issuer, generators, type Client } from "openid-client"

import { getCognitoOidcConfig, getMissingCognitoOidcConfig } from "@/lib/cognito"

let clientPromise: Promise<Client> | null = null

export function generateState() {
  return generators.state()
}

export function generateNonce() {
  return generators.nonce()
}

async function createClient(): Promise<Client> {
  const config = getCognitoOidcConfig()
  if (!config) {
    const missing = getMissingCognitoOidcConfig()
    throw new Error(
      missing.length
        ? `Missing Cognito OIDC configuration: ${missing.join(", ")}`
        : "Cognito OIDC configuration could not be resolved.",
    )
  }

  const issuer = await Issuer.discover(config.issuerUrl)

  return new issuer.Client({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uris: [config.redirectUri],
    response_types: ["code"],
  })
}

export async function getOidcClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = createClient().catch((error) => {
      clientPromise = null
      throw error
    })
  }

  return clientPromise
}
