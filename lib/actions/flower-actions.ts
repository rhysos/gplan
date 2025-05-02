"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getAllFlowers() {
  try {
    return await sql`
      SELECT id, name, spacing, image_url
      FROM plants
      ORDER BY name ASC
    `
  } catch (error) {
    console.error("Error getting flowers:", error)
    throw new Error("Failed to get flowers")
  }
}

export async function createFlower(name: string, spacing: number, imageUrl: string) {
  try {
    const result = await sql`
      INSERT INTO plants (name, spacing, image_url)
      VALUES (${name}, ${spacing}, ${imageUrl})
      RETURNING id, name, spacing, image_url
    `

    revalidatePath("/dashboard")
    return result[0]
  } catch (error) {
    console.error("Error creating flower:", error)
    throw new Error("Failed to create flower")
  }
}

export async function updateFlower(id: number, name: string, spacing: number, imageUrl: string) {
  try {
    const result = await sql`
      UPDATE plants
      SET name = ${name}, spacing = ${spacing}, image_url = ${imageUrl}
      WHERE id = ${id}
      RETURNING id, name, spacing, image_url
    `

    revalidatePath("/dashboard")
    return result[0]
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
