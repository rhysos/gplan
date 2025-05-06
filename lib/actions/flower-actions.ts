"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getAllFlowers(userId: number) {
  try {
    // Try to get flowers with quantity
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
  } catch (error) {
    console.error("Error getting flowers:", error)
    throw new Error("Failed to get flowers")
  }
}

export async function getFlowersWithUsage() {
  try {
    // Get all flowers with their usage counts
    try {
      const flowers = await sql`
        SELECT p.id, p.name, p.spacing, p.image_url, p.quantity, 
               COUNT(pi.id) as used_count
        FROM plants p
        LEFT JOIN plant_instances pi ON p.id = pi.plant_id
        GROUP BY p.id, p.name, p.spacing, p.image_url, p.quantity
        ORDER BY p.name ASC
      `
      return flowers
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        const flowers = await sql`
          SELECT p.id, p.name, p.spacing, p.image_url, 
                 COUNT(pi.id) as used_count
          FROM plants p
          LEFT JOIN plant_instances pi ON p.id = pi.plant_id
          GROUP BY p.id, p.name, p.spacing, p.image_url
          ORDER BY p.name ASC
        `
        // Add default quantity value
        return flowers.map((flower) => ({
          ...flower,
          quantity: 10, // Default quantity
        }))
      }
      throw error
    }
  } catch (error) {
    console.error("Error getting flowers with usage:", error)
    throw new Error("Failed to get flowers with usage")
  }
}

export async function getFlowerUsageCounts() {
  try {
    const usageCounts = await sql`
      SELECT plant_id, COUNT(*) as count
      FROM plant_instances
      GROUP BY plant_id
    `

    // Convert to a more usable format
    const countsMap: Record<number, number> = {}
    for (const row of usageCounts) {
      countsMap[row.plant_id] = Number.parseInt(row.count)
    }

    return countsMap
  } catch (error) {
    console.error("Error getting flower usage counts:", error)
    return {}
  }
}

export async function createFlower(name: string, spacing: number, imageUrl: string, quantity = 10, userId?: number) {
  try {
    // Try to create flower with quantity
    try {
      const result = await sql`
        INSERT INTO plants (name, spacing, image_url, quantity, user_id)
        VALUES (${name}, ${spacing}, ${imageUrl}, ${quantity}, ${userId})
        RETURNING id, name, spacing, image_url, quantity
      `
      revalidatePath("/dashboard")
      return result[0]
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        const result = await sql`
          INSERT INTO plants (name, spacing, image_url, user_id)
          VALUES (${name}, ${spacing}, ${imageUrl}, ${userId})
          RETURNING id, name, spacing, image_url
        `
        // Add default quantity value
        revalidatePath("/dashboard")
        return { ...result[0], quantity }
      }
      throw error
    }
  } catch (error) {
    console.error("Error creating flower:", error)
    throw new Error("Failed to create flower")
  }
}

export async function updateFlower(id: number, name: string, spacing: number, imageUrl: string, quantity = 10) {
  try {
    // Try to update flower with quantity
    try {
      const result = await sql`
        UPDATE plants
        SET name = ${name}, spacing = ${spacing}, image_url = ${imageUrl}, quantity = ${quantity}
        WHERE id = ${id}
        RETURNING id, name, spacing, image_url, quantity
      `
      revalidatePath("/dashboard")
      return result[0]
    } catch (error) {
      // If quantity column doesn't exist, fall back to the original query
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        const result = await sql`
          UPDATE plants
          SET name = ${name}, spacing = ${spacing}, image_url = ${imageUrl}
          WHERE id = ${id}
          RETURNING id, name, spacing, image_url
        `
        // Add default quantity value
        revalidatePath("/dashboard")
        return { ...result[0], quantity }
      }
      throw error
    }
  } catch (error) {
    console.error("Error updating flower:", error)
    throw new Error("Failed to update flower")
  }
}

export async function deleteFlower(id: number) {
  try {
    await sql`
      DELETE FROM plants WHERE id = ${id}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting flower:", error)
    throw new Error("Failed to delete flower")
  }
}

// Function to add quantity column to plants table
export async function addQuantityColumn() {
  try {
    try {
      // Check if the column exists
      await sql`SELECT quantity FROM plants LIMIT 1`
      console.log("Quantity column already exists")
      return { success: true, message: "Quantity column already exists" }
    } catch (error) {
      if (error instanceof Error && error.message.includes('column "quantity" does not exist')) {
        console.log("Adding quantity column to plants table")
        // Add the column
        await sql`ALTER TABLE plants ADD COLUMN quantity INTEGER DEFAULT 10 NOT NULL`
        return { success: true, message: "Quantity column added successfully" }
      }
      throw error
    }
  } catch (error) {
    console.error("Error adding quantity column:", error)
    return { success: false, error: "Failed to add quantity column" }
  }
}