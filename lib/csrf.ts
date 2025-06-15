import { cookies } from "next/headers"

const SECRET_LENGTH = 32
const CSRF_DATA_TO_SIGN = "manary-csrf-token" // Constant data to sign for HMAC

// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Helper to create HMAC signature using Web Crypto API
async function createHmacSignature(secret: BufferSource, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  return bufferToHex(signature)
}

// This function gets the secret, or creates and sets it as an HTTPOnly cookie if not present.
function getSecret(): Buffer {
  const cookieStore = cookies()
  const secretCookie = cookieStore.get("csrf_secret")
  if (secretCookie && secretCookie.value) {
    return Buffer.from(secretCookie.value, "hex")
  }

  const newSecretBytes = new Uint8Array(SECRET_LENGTH)
  crypto.getRandomValues(newSecretBytes)
  const newSecret = Buffer.from(newSecretBytes)

  cookieStore.set("csrf_secret", newSecret.toString("hex"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return newSecret
}

export async function generateCSRFToken(): Promise<string> {
  const secret = getSecret() // Ensures csrf_secret cookie is set
  const token = await createHmacSignature(secret, CSRF_DATA_TO_SIGN)
  return token // Returns only the token string
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const secretCookie = cookieStore.get("csrf_secret")
    if (!secretCookie || !secretCookie.value) {
      console.error("CSRF secret cookie not found for validation.")
      return false
    }
    const secret = Buffer.from(secretCookie.value, "hex")
    const expectedToken = await createHmacSignature(secret, CSRF_DATA_TO_SIGN)

    if (token.length !== expectedToken.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
    }
    return result === 0
  } catch (error) {
    console.error("Error validating CSRF token:", error)
    return false
  }
}
