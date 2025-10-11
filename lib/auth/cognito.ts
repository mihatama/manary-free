import { Buffer } from "node:buffer"
import { createHmac } from "node:crypto"

type JwtPayload = {
  sub?: string
  email?: string
  [key: string]: unknown
}

export function computeSecretHash(username: string, clientId: string, clientSecret: string) {
  return createHmac("sha256", clientSecret).update(username + clientId).digest("base64")
}

export function decodeIdToken(idToken: string): JwtPayload | null {
  const parts = idToken.split(".")
  if (parts.length < 2) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const payloadJson = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(payloadJson) as JwtPayload
  } catch (error) {
    console.error("Failed to decode Cognito ID token:", error)
    return null
  }
}
