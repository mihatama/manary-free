import { NextResponse } from "next/server"
import { generateCSRFToken } from "@/lib/csrf" // Corrected import

// Removed 'cookies' import as it's not directly used here anymore for setting the secret.
// The csrf_secret cookie is now managed by the getSecret() function within lib/csrf.ts

export async function GET() {
  try {
    // generateCSRFToken will call getSecret internally,
    // which handles getting or creating the secret and setting the csrf_secret cookie.
    const token = await generateCSRFToken()

    // The csrf_secret cookie is set by getSecret() in lib/csrf.ts
    // No need to set it here explicitly.

    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    console.error("Error in /api/csrf route:", error)
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
