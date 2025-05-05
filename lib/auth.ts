import { cookies } from "next/headers"
import {
  getUserByEmail,
  createUser as dbCreateUser,
  verifyPassword,
  createSession,
  getSessionBySessionId,
  deleteSession,
  getUserById,
  warmupDatabaseConnection,
} from "./db"

// Add a connection warming function that can be called during app initialization
export async function initializeAuth() {
  return await warmupDatabaseConnection()
}

// Make sure the getSession function is correctly retrieving the session
export async function getSession() {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  try {
    console.time("getSession")
    const session = await getSessionBySessionId(sessionId)
    console.timeEnd("getSession")

    // Add debug logging
    console.log("Session retrieved:", session ? "Session found" : "No session found")

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    // Don't throw here, just return null to handle gracefully
    return null
  }
}

export async function getCurrentUser() {
  try {
    console.time("getCurrentUser")
    const session = await getSession()

    if (!session) {
      console.timeEnd("getCurrentUser")
      return null
    }

    const user = await getUserById(session.user_id)
    console.timeEnd("getCurrentUser")
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    console.timeEnd("getCurrentUser")
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

// Make sure the login function is correctly setting the cookie
export async function login(email: string, password: string) {
  try {
    console.time("login")
    // Warm up the connection before attempting login
    await warmupDatabaseConnection()

    const user = await getUserByEmail(email)

    if (!user) {
      console.timeEnd("login")
      return { success: false, error: "Invalid email or password" }
    }

    const isPasswordValid = verifyPassword(password, user.password_hash)

    if (!isPasswordValid) {
      console.timeEnd("login")
      return { success: false, error: "Invalid email or password" }
    }

    const { sessionId, expiresAt } = await createSession(user.id)

    // Set the cookie with proper attributes
    cookies().set("session_id", sessionId, {
      httpOnly: true,
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    console.timeEnd("login")
    return { success: true, user: { id: user.id, name: user.name, email: user.email } }
  } catch (error) {
    console.error("Login error:", error)
    console.timeEnd("login")
    return { success: false, error: "An error occurred during login. Please try again later." }
  }
}

export async function signup(name: string, email: string, password: string) {
  try {
    // Warm up the connection before attempting signup
    await warmupDatabaseConnection()

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
