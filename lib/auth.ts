export type AuthError = {
  email?: string[]
  password?: string[]
  general?: string[]
  confirmPassword?: string[]
}

export async function getSession() {
  return null
}

export async function requireAuth() {
  return null
}
