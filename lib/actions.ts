"use server"

import { login as authLogin, signup as authSignup, logout as authLogout } from "./auth"
import {
  getGardensByUserId,
  createGarden,
  updateGarden,
  deleteGarden,
  getRowsByGardenId,
  createRow,
  updateRow,
  deleteRow,
  getPlantInstancesByRowId,
  deletePlantInstance,
  getAllPlants as dbGetAllPlants,
  getPlantUsageCounts,
  createPlantInstanceWithDetails,
} from "./db"
import { revalidatePath } from "next/cache"

// Auth actions
export async function loginUser(email: string, password: string) {
  try {
    const result = await authLogin(email, password)
    if (result.success) {
      revalidatePath("/dashboard")
    }
    return result
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during login",
    }
  }
}

export async function signupUser(name: string, email: string, password: string) {
  const result = await authSignup(name, email, password)
  if (result.success) {
    revalidatePath("/dashboard")
  }
  return result
}

export async function logoutUser() {
  await authLogout()
  revalidatePath("/")
  return { success: true }
}

// Garden actions
export async function getUserGardens(userId: number) {
  return await getGardensByUserId(userId)
}

export async function createUserGarden(userId: number, name: string) {
  const garden = await createGarden(userId, name)
  revalidatePath("/dashboard")
  return garden
}

export async function updateUserGarden(gardenId: number, userId: number, name: string) {
  const garden = await updateGarden(gardenId, userId, name)
  revalidatePath("/dashboard")
  return garden
}

export async function deleteUserGarden(gardenId: number, userId: number) {
  await deleteGarden(gardenId, userId)
  revalidatePath("/dashboard")
  return { success: true }
}

// Row actions
export async function getGardenRows(gardenId: number) {
  return await getRowsByGardenId(gardenId)
}

// Update the createGardenRow function to include row_ends as a number
export async function createGardenRow(gardenId: number, name: string, length: number, rowEnds = 0) {
  const row = await createRow(gardenId, name, length, rowEnds)
  revalidatePath("/dashboard")
  return row
}

// Update the updateGardenRow function to include row_ends as a number
export async function updateGardenRow(rowId: number, name: string, length: number, rowEnds = 0) {
  const row = await updateRow(rowId, name, length, rowEnds)
  revalidatePath("/dashboard")
  return row
}

export async function deleteGardenRow(rowId: number) {
  await deleteRow(rowId)
  revalidatePath("/dashboard")
  return { success: true }
}

// Plant actions
export async function getPlants() {
  return await dbGetAllPlants()
}

export async function getFlowerUsageCounts() {
  return await getPlantUsageCounts()
}

// Plant instance actions
export async function getRowPlants(rowId: number) {
  return await getPlantInstancesByRowId(rowId)
}

export async function addPlantToRow(rowId: number, plantId: number, position: number) {
  try {
    // Use the optimized function that gets plant details in a single query
    const plantInstance = await createPlantInstanceWithDetails(rowId, plantId, position)

    // No need for a separate query to get plant details
    revalidatePath("/dashboard")
    return plantInstance
  } catch (error) {
    console.error("Error adding plant to row:", error)
    throw error
  }
}

export async function removePlantFromRow(instanceId: number) {
  await deletePlantInstance(instanceId)
  revalidatePath("/dashboard")
  return { success: true }
}

export const getAllFlowers = dbGetAllPlants
