"use client"

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export type EncryptedPayload = {
  iv: string
  ciphertext: string
}

function assertBrowser() {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Encryption utilities require a browser environment with Web Crypto support")
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function generateKeyBase64(): Promise<string> {
  assertBrowser()
  const buffer = new Uint8Array(32)
  window.crypto.getRandomValues(buffer)
  return bytesToBase64(buffer)
}

async function importAesKey(base64Key: string, usages: KeyUsage[]): Promise<CryptoKey> {
  assertBrowser()
  const raw = base64ToBytes(base64Key)
  return window.crypto.subtle.importKey("raw", raw, "AES-GCM", false, usages)
}

export async function encryptString(plaintext: string, base64Key: string): Promise<EncryptedPayload> {
  assertBrowser()
  const key = await importAesKey(base64Key, ["encrypt"])
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  const encoded = textEncoder.encode(plaintext)
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptToString(payload: EncryptedPayload, base64Key: string): Promise<string> {
  assertBrowser()
  const key = await importAesKey(base64Key, ["decrypt"])
  const iv = base64ToBytes(payload.iv)
  const ciphertext = base64ToBytes(payload.ciphertext)
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  return textDecoder.decode(decrypted)
}

async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  assertBrowser()
  const material = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  )
}

export type SealedKey = {
  salt: string
  iv: string
  ciphertext: string
}

export async function sealKey(base64Key: string, passphrase: string): Promise<SealedKey> {
  assertBrowser()
  const salt = new Uint8Array(16)
  window.crypto.getRandomValues(salt)
  const wrappingKey = await deriveWrappingKey(passphrase, salt)
  const iv = new Uint8Array(12)
  window.crypto.getRandomValues(iv)
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    base64ToBytes(base64Key),
  )
  return {
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  }
}

export async function unsealKey(sealed: SealedKey, passphrase: string): Promise<string> {
  assertBrowser()
  const salt = base64ToBytes(sealed.salt)
  const wrappingKey = await deriveWrappingKey(passphrase, salt)
  const iv = base64ToBytes(sealed.iv)
  const ciphertext = base64ToBytes(sealed.ciphertext)
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, wrappingKey, ciphertext)
  return bytesToBase64(new Uint8Array(decrypted))
}
