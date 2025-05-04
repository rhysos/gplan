import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless"
import { createHash, randomBytes } from "crypto"

// Configure neon with improved connection settings
neonConfig.fetchConnectionCache = true
neonConfig.retryOptions = {
  retries: 5, // Increased from 3
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff with max 10s
}

// Create a more resilient SQL client with better error handling
let sqlClient: NeonQueryFunction<any, any> | null = null

/**
 * Get a database connection with retry logic
 */
export async function getSql() {
  if (!sqlClient) {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set")
      }

      sqlClient = neon(process.env.DATABASE_URL)

      // Test the connection
      await sqlClient`SELECT 1`
      console.log("Database connection established successfully")
    } catch (error) {
      console.error("Failed to initialize database connection:", error)
      sqlClient = null
      throw new Error(
        "Database connection failed to initialize: " + (error instanceof Error ? error.message : String(error)),
      )
    }
  }

  return sqlClient
}

/**
 * Execute a SQL query with proper error handling and connection management
 */
export async function executeQuery<T = any>(
  queryFn: (sql: NeonQueryFunction<any, any>) => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    const sql = await getSql()
    return await queryFn(sql)
  } catch (error) {
    console.error(`${errorMessage}:`, error)

    // If it's a connection error, clear the client to force reconnection on next attempt
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("connection") ||
        error.message.includes("network"))
    ) {
      console.log("Connection error detected, resetting client")
      sqlClient = null
    }

    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`)
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
export async function getAllPlants() {
  return executeQuery(async (sql) => {
    // Check if quantity column exists
    try {
      return await sql`
        SELECT id, name, spacing, image_url, quantity
        FROM plants
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
