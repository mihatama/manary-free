import { cookies } from "next/headers"

const SECRET_LENGTH = 32
const CSRF_DATA_TO_SIGN = "manary-csrf-token" // Constant data to sign for HMAC

// Helper to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

// Helper to create HMAC signature using Web Crypto API
async function createHmacSignature(secret: BufferSource, data: string): Promise<string> {
  // Use the global crypto object which is standard in modern environments
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
  return bufferToHex(signature)
}

// This function gets the secret, or creates and sets it as an HTTPOnly cookie if not present.
async function getSecret(): Promise<Uint8Array> {
  const cookieStore = await cookies()
  const secretCookie = cookieStore.get("csrf_secret")
  if (secretCookie && secretCookie.value) {
    return hexToUint8Array(secretCookie.value)
  }

  // Use the global crypto object to generate random values
  const newSecretBytes = new Uint8Array(SECRET_LENGTH)
  crypto.getRandomValues(newSecretBytes)

  cookieStore.set("csrf_secret", bufferToHex(newSecretBytes), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return newSecretBytes
}

export async function generateCSRFToken(): Promise<string> {
  const secret = await getSecret() // Ensures csrf_secret cookie is set
  const token = await createHmacSignature(secret, CSRF_DATA_TO_SIGN)
  return token
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const secretCookie = cookieStore.get("csrf_secret")
    if (!secretCookie || !secretCookie.value) {
      console.error("CSRF secret cookie not found for validation.")
      return false
    }
    const secret = hexToUint8Array(secretCookie.value)
    const expectedToken = await createHmacSignature(secret, CSRF_DATA_TO_SIGN)

    // Constant-time comparison is crucial for security
    if (token.length !== expectedToken.length) {
      return false
    }

    const tokenBytes = new TextEncoder().encode(token)
    const expectedTokenBytes = new TextEncoder().encode(expectedToken)

    // crypto.subtle.timingSafeEqual is the ideal way, but not universally available.
    // We can build a robust fallback.
    let result = 0
    for (let i = 0; i < tokenBytes.length; i++) {
      result |= tokenBytes[i] ^ expectedTokenBytes[i]
    }
    return result === 0
  } catch (error) {
    console.error("Error validating CSRF token:", error)
    return false
  }
}
