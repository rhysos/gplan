import { cookies } from "next/headers"
import {
  getUserByEmail,
  createUser as dbCreateUser,
  verifyPassword,
  createSession,
  getSessionBySessionId,
  deleteSession,
  getUserById,
} from "./db"

export async function getSession() {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  try {
    const session = await getSessionBySessionId(sessionId)
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    // Don't throw here, just return null to handle gracefully
    return null
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession()

    if (!session) {
      return null
    }

    const user = await getUserById(session.user_id)
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    // Don't throw here, just return null to handle gracefully
    return null
  }
}

export async function requireAuth() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      // Instead of redirecting here, we'll return a flag indicating authentication is required
      return { authenticated: false }
    }

    return { authenticated: true, user }
  } catch (error) {
    console.error("Authentication error:", error)
    return { authenticated: false, error }
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const isPasswordValid = verifyPassword(password, user.password_hash)

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    const { sessionId, expiresAt } = await createSession(user.id)

    cookies().set("session_id", sessionId, {
      httpOnly: true,
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return { success: true, user: { id: user.id, name: user.name, email: user.email } }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login. Please try again later." }
  }
}

export async function signup(name: string, email: string, password: string) {
  try {
    const user = await dbCreateUser(name, email, password)

    const { sessionId, expiresAt } = await createSession(user.id)

    cookies().set("session_id", sessionId, {
      httpOnly: true,
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return { success: true, user }
  } catch (error: any) {
    console.error("Signup error:", error)
    return { success: false, error: error.message || "An error occurred during signup" }
  }
}

export async function logout() {
  const sessionId = cookies().get("session_id")?.value

  if (sessionId) {
    try {
      await deleteSession(sessionId)
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  cookies().delete("session_id")
}
