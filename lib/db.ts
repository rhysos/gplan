import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless"
import { createHash, randomBytes } from "crypto"

// Configure neon with improved connection settings
// Remove the deprecated fetchConnectionCache option
neonConfig.retryOptions = {
  retries: 10, // Increase retries from 5 to 10
  retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry with max 5s delay
}

// Create a more resilient SQL client with better error handling
let sqlClient: NeonQueryFunction<any, any> | null = null
let connectionAttemptInProgress = false
let lastConnectionAttempt = 0
const CONNECTION_COOLDOWN = 5000 // 5 seconds cooldown between connection attempts

/**
 * Get a database connection with improved retry logic
 */
export async function getSql() {
  // If we already have a client, return it
  if (sqlClient) {
    return sqlClient
  }

  // If a connection attempt is already in progress, wait for it
  if (connectionAttemptInProgress) {
    // Wait for the current attempt to finish (max 5 seconds)
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (sqlClient) return sqlClient
    }
    // If we still don't have a client after waiting, throw an error
    throw new Error("Database connection timeout while waiting for existing connection attempt")
  }

  // Check if we're in the cooldown period after a failed attempt
  const now = Date.now()
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    throw new Error("Database connection cooldown period - please try again in a few seconds")
  }

  // Start a new connection attempt
  connectionAttemptInProgress = true
  lastConnectionAttempt = now

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    console.log("Initializing database connection...")

    // Create a connection with a timeout
    const connectionPromise = neon(process.env.DATABASE_URL)

    // Set a timeout for the connection attempt
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Database connection timeout after 10 seconds")), 10000)
    })

    // Race the connection against the timeout
    sqlClient = (await Promise.race([connectionPromise, timeoutPromise])) as NeonQueryFunction<any, any>

    // Test the connection with a simple query
    await sqlClient`SELECT 1`
    console.log("Database connection established successfully")

    return sqlClient
  } catch (error) {
    console.error("Failed to initialize database connection:", error)
    sqlClient = null
    throw new Error(
      "Database connection failed to initialize: " + (error instanceof Error ? error.message : String(error)),
    )
  } finally {
    connectionAttemptInProgress = false
  }
}

/**
 * Execute a SQL query with proper error handling and connection management
 */
export async function executeQuery<T = any>(
  queryFn: (sql: NeonQueryFunction<any, any>) => Promise<T>,
  errorMessage: string,
  maxRetries = 3,
): Promise<T> {
  let retries = 0

  while (true) {
    try {
      const sql = await getSql()

      // Set a timeout for the query execution
      const queryPromise = queryFn(sql)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Query execution timeout after 15 seconds")), 15000)
      })

      // Race the query against the timeout
      return (await Promise.race([queryPromise, timeoutPromise])) as T
    } catch (error) {
      console.error(`${errorMessage} (attempt ${retries + 1}/${maxRetries}):`, error)

      // If we've reached max retries, throw the error
      if (retries >= maxRetries) {
        throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`)
      }

      // If it's a connection error, clear the client to force reconnection on next attempt
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("connection") ||
          error.message.includes("network") ||
          error.message.includes("timeout"))
      ) {
        console.log("Connection error detected, resetting client")
        sqlClient = null
      }

      // Exponential backoff before retry
      const backoffTime = Math.min(100 * 2 ** retries, 1000)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
      retries++
    }
  }
}

// User functions
export async function createUser(name: string, email: string, password: string) {
  const passwordHash = hashPassword(password)

  return executeQuery(async (sql) => {
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email
    `

    if (!result || result.length === 0) {
      throw new Error("No result returned from user creation")
    }

    return result[0]
  }, "Failed to create user").catch((error) => {
    if (error.message.includes("duplicate key")) {
      throw new Error("Email already exists")
    }
    throw error
  })
}

export async function getUserByEmail(email: string) {
  return executeQuery(async (sql) => {
    const users = await sql`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ${email}
    `

    return users[0] || null
  }, "Failed to get user by email")
}

export async function getUserById(id: number) {
  return executeQuery(async (sql) => {
    const users = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${id}
    `

    return users[0] || null
  }, "Failed to get user by ID")
}

// Session functions
export async function createSession(userId: number) {
  return executeQuery(async (sql) => {
    const sessionId = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await sql`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt})
    `

    console.log(`Session created for user ${userId} with ID ${sessionId}`)
    return { sessionId, expiresAt }
  }, "Failed to create session")
}

export async function getSessionBySessionId(sessionId: string) {
  return executeQuery(async (sql) => {
    const sessions = await sql`
      SELECT s.id, s.user_id, s.expires_at, u.name, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > NOW()
    `

    console.log(`Session lookup for ${sessionId}: ${sessions.length > 0 ? "Found" : "Not found"}`)
    return sessions[0] || null
  }, "Failed to get session")
}

export async function deleteSession(sessionId: string) {
  return executeQuery(async (sql) => {
    await sql`
      DELETE FROM sessions
      WHERE id = ${sessionId}
    `
    return true
  }, "Failed to delete session")
}

// Garden functions
export async function getGardensByUserId(userId: number) {
  return executeQuery(async (sql) => {
    return await sql`
      SELECT id, name, created_at, updated_at
      FROM gardens
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `
  }, "Failed to get gardens")
}

export async function getGardenById(gardenId: number, userId: number) {
  return executeQuery(async (sql) => {
    const gardens = await sql`
      SELECT id, name, created_at, updated_at
      FROM gardens
      WHERE id = ${gardenId} AND user_id = ${userId}
    `

    return gardens[0] || null
  }, "Failed to get garden")
}

export async function createGarden(userId: number, name: string) {
  return executeQuery(async (sql) => {
    const result = await sql`
      INSERT INTO gardens (user_id, name)
      VALUES (${userId}, ${name})
      RETURNING id, name, created_at, updated_at
    `

    return result[0]
  }, "Failed to create garden")
}

export async function updateGarden(gardenId: number, userId: number, name: string) {
  return executeQuery(async (sql) => {
    const result = await sql`
      UPDATE gardens
      SET name = ${name}, updated_at = NOW()
      WHERE id = ${gardenId} AND user_id = ${userId}
      RETURNING id, name, created_at, updated_at
    `

    return result[0] || null
  }, "Failed to update garden")
}

export async function deleteGarden(gardenId: number, userId: number) {
  return executeQuery(async (sql) => {
    await sql`
      DELETE FROM gardens
      WHERE id = ${gardenId} AND user_id = ${userId}
    `
    return true
  }, "Failed to delete garden")
}

// Row functions
export async function getRowsByGardenId(gardenId: number) {
  return executeQuery(async (sql) => {
    try {
      return await sql`
        SELECT id, name, length, row_ends, created_at, updated_at
        FROM garden_rows
        WHERE garden_id = ${gardenId}
        ORDER BY created_at ASC
      `
    } catch (error) {
      // If row_ends column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "row_ends" does not exist')) {
        console.log("Row ends column doesn't exist, using fallback query")
        const rows = await sql`
          SELECT id, name, length, created_at, updated_at
          FROM garden_rows
          WHERE garden_id = ${gardenId}
          ORDER BY created_at ASC
        `
        // Add default row_ends value
        return rows.map((row) => ({
          ...row,
          row_ends: 0, // Default to 0
        }))
      }
      throw error
    }
  }, "Failed to get rows")
}

export async function createRow(gardenId: number, name: string, length: number, rowEnds = 0) {
  return executeQuery(async (sql) => {
    try {
      const result = await sql`
        INSERT INTO garden_rows (garden_id, name, length, row_ends)
        VALUES (${gardenId}, ${name}, ${length}, ${rowEnds})
        RETURNING id, name, length, row_ends, created_at, updated_at
      `
      return result[0]
    } catch (error) {
      // If row_ends column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "row_ends" does not exist')) {
        const result = await sql`
          INSERT INTO garden_rows (garden_id, name, length)
          VALUES (${gardenId}, ${name}, ${length})
          RETURNING id, name, length, created_at, updated_at
        `
        return { ...result[0], row_ends: 0 }
      }
      throw error
    }
  }, "Failed to create row")
}

export async function updateRow(rowId: number, name: string, length: number, rowEnds = 0) {
  return executeQuery(async (sql) => {
    try {
      const result = await sql`
        UPDATE garden_rows
        SET name = ${name}, length = ${length}, row_ends = ${rowEnds}, updated_at = NOW()
        WHERE id = ${rowId}
        RETURNING id, name, length, row_ends, created_at, updated_at
      `
      return result[0] || null
    } catch (error) {
      // If row_ends column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "row_ends" does not exist')) {
        const result = await sql`
          UPDATE garden_rows
          SET name = ${name}, length = ${length}, updated_at = NOW()
          WHERE id = ${rowId}
          RETURNING id, name, length, created_at, updated_at
        `
        return { ...result[0], row_ends: 0 }
      }
      throw error
    }
  }, "Failed to update row")
}

export async function deleteRow(rowId: number) {
  return executeQuery(async (sql) => {
    await sql`
      DELETE FROM garden_rows
      WHERE id = ${rowId}
    `
    return true
  }, "Failed to delete row")
}

// Plant functions
export async function getAllPlants(userId: number) {
  return executeQuery(async (sql) => {
    // Check if quantity column exists
    try {
      return await sql`
        SELECT id, name, spacing, image_url, quantity
        FROM plants
        WHERE user_id = ${userId}
        ORDER BY name ASC
      `
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        console.log("Quantity column doesn't exist, using fallback query")
        const plants = await sql`
          SELECT id, name, spacing, image_url
          FROM plants
          ORDER BY name ASC
        `
        // Add default quantity value
        return plants.map((plant) => ({
          ...plant,
          quantity: 10, // Default quantity
        }))
      }
      throw error
    }
  }, "Failed to get plants")
}

export async function getPlantById(plantId: number) {
  return executeQuery(async (sql) => {
    try {
      const plants = await sql`
        SELECT id, name, spacing, image_url, quantity
        FROM plants
        WHERE id = ${plantId}
      `
      return plants[0] || null
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        const plants = await sql`
          SELECT id, name, spacing, image_url
          FROM plants
          WHERE id = ${plantId}
        `
        // Add default quantity value
        return plants[0] ? { ...plants[0], quantity: 10 } : null
      }
      throw error
    }
  }, "Failed to get plant by ID")
}

// Plant instance functions
export async function getPlantInstancesByRowId(rowId: number) {
  return executeQuery(async (sql) => {
    return await sql`
      SELECT pi.id, pi.position, pi.plant_id, p.name, p.spacing, p.image_url
      FROM plant_instances pi
      JOIN plants p ON pi.plant_id = p.id
      WHERE pi.row_id = ${rowId}
      ORDER BY pi.position ASC
    `
  }, "Failed to get plant instances")
}

export async function createPlantInstance(rowId: number, plantId: number, position: number) {
  return executeQuery(async (sql) => {
    const result = await sql`
      INSERT INTO plant_instances (row_id, plant_id, position)
      VALUES (${rowId}, ${plantId}, ${position})
      RETURNING id, plant_id, position
    `

    return result[0]
  }, "Failed to create plant instance")
}

// Optimized function that creates a plant instance and returns all details in a single query
export async function createPlantInstanceWithDetails(rowId: number, plantId: number, position: number) {
  return executeQuery(async (sql) => {
    try {
      const result = await sql`
        WITH new_instance AS (
          INSERT INTO plant_instances (row_id, plant_id, position)
          VALUES (${rowId}, ${plantId}, ${position})
          RETURNING id, plant_id, position
        )
        SELECT ni.id, ni.plant_id, ni.position, p.name, p.spacing, p.image_url, p.quantity
        FROM new_instance ni
        JOIN plants p ON ni.plant_id = p.id
      `
      return result[0]
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        const result = await sql`
          WITH new_instance AS (
            INSERT INTO plant_instances (row_id, plant_id, position)
            VALUES (${rowId}, ${plantId}, ${position})
            RETURNING id, plant_id, position
          )
          SELECT ni.id, ni.plant_id, ni.position, p.name, p.spacing, p.image_url
          FROM new_instance ni
          JOIN plants p ON ni.plant_id = p.id
        `
        // Add default quantity value
        return { ...result[0], quantity: 10 }
      }
      throw error
    }
  }, "Failed to create plant instance with details")
}

export async function deletePlantInstance(instanceId: number) {
  return executeQuery(async (sql) => {
    // First get details about the plant instance and its position
    const instance = await sql`
      SELECT pi.id, pi.row_id, pi.plant_id, pi.position
      FROM plant_instances pi
      WHERE pi.id = ${instanceId}
    `

    if (instance.length === 0) {
      throw new Error("Plant instance not found")
    }

    const { row_id, plant_id, position } = instance[0]

    // Get the spacing of the plant being removed
    const plant = await sql`
      SELECT spacing FROM plants WHERE id = ${plant_id}
    `
    const removedSpacing = plant[0].spacing

    // Move plants to the right of the removed plant to the left
    await sql`
      UPDATE plant_instances
      SET position = position - ${removedSpacing}
      WHERE row_id = ${row_id}
      AND position > ${position}
    `

    // Increment the quantity of the removed plant
    await sql`
      UPDATE plants
      SET quantity = quantity + 1
      WHERE id = ${plant_id}
    `

    // Finally delete the plant instance
    await sql`
      DELETE FROM plant_instances
      WHERE id = ${instanceId}
    `

    return true
  }, "Failed to delete plant instance")
}

// Helper functions
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const passwordHash = hashPassword(password)
  return passwordHash === hashedPassword
}

export async function getSqlFromPool() {
  return await getSql()
}

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const sqlClient = await getSqlFromPool()
  return sqlClient(strings, ...values)
}

// Add this function to get plant usage counts
export async function getPlantUsageCounts() {
  return executeQuery(async (sql) => {
    const result = await sql`
      SELECT plant_id, COUNT(*) as count
      FROM plant_instances
      GROUP BY plant_id
    `

    // Convert to a more usable format
    const countsMap: Record<number, number> = {}
    for (const row of result) {
      countsMap[row.plant_id] = Number.parseInt(row.count)
    }

    return countsMap
  }, "Failed to get plant usage counts")
}

// Function to check if quantity column exists and add it if it doesn't
export async function ensureQuantityColumn() {
  return executeQuery(async (sql) => {
    try {
      // Check if the column exists
      await sql`SELECT quantity FROM plants LIMIT 1`
      console.log("Quantity column already exists")
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        console.log("Adding quantity column to plants table")
        // Add the column
        await sql`ALTER TABLE plants ADD COLUMN quantity INTEGER DEFAULT 10 NOT NULL`
        return true
      }
      throw error
    }
  }, "Failed to ensure quantity column")
}

// Add a connection warming function
export async function warmupDatabaseConnection() {
  try {
    console.log("Warming up database connection...")
    const sql = await getSql()
    await sql`SELECT 1`
    console.log("Database connection warmed up successfully")
    return true
  } catch (error) {
    console.error("Failed to warm up database connection:", error)
    return false
  }
}
