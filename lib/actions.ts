"use server"

import { login as authLogin, signup as authSignup, logout as authLogout } from "./auth"
import {
  getGardensByUserId,
  createGarden as dbCreateGarden,
  updateGarden as dbUpdateGarden,
  deleteGarden as dbDeleteGarden,
  getRowsByGardenId,
  createRow as dbCreateRow,
  updateRow as dbUpdateRow,
  deleteRow as dbDeleteRow,
  getPlantInstancesByRowId,
  deletePlantInstance,
  getAllPlants as dbGetAllPlants,
  getPlantUsageCounts,
  createPlantInstanceWithDetails,
  movePlantInstanceLeft,
  movePlantInstanceRight,
  moveRowUp as dbMoveRowUp,
  moveRowDown as dbMoveRowDown,
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
export async function getGardens() {
  // For now, we'll assume user ID 1
  return await getGardensByUserId(1)
}

export async function createGarden(name: string) {
  // For now, we'll assume user ID 1
  const garden = await dbCreateGarden(1, name)
  revalidatePath("/dashboard")
  return garden
}

export async function updateGarden(gardenId: number, name: string) {
  // For now, we'll assume user ID 1
  const garden = await dbUpdateGarden(gardenId, 1, name)
  revalidatePath("/dashboard")
  return garden
}

export async function deleteGarden(gardenId: number) {
  // For now, we'll assume user ID 1
  await dbDeleteGarden(gardenId, 1)
  revalidatePath("/dashboard")
  return { success: true }
}

// Row actions
export async function getRows(gardenId: number) {
  return await getRowsByGardenId(gardenId)
}

export async function createRow(gardenId: number, name: string, length: number, rowEnds = 0) {
  const row = await dbCreateRow(gardenId, name, length, rowEnds)
  revalidatePath("/dashboard")
  return row
}

export async function updateRow(rowId: number, name: string, length: number, rowEnds = 0) {
  const row = await dbUpdateRow(rowId, name, length, rowEnds)
  revalidatePath("/dashboard")
  return row
}

export async function deleteRow(rowId: number) {
  await dbDeleteRow(rowId)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function moveRowUp(rowId: number) {
  await dbMoveRowUp(rowId)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function moveRowDown(rowId: number) {
  await dbMoveRowDown(rowId)
  revalidatePath("/dashboard")
  return { success: true }
}

// Plant actions
export async function getAllFlowers(userId: number) {
  return await dbGetAllPlants()
}

export async function getFlowerUsageCounts() {
  return await getPlantUsageCounts()
}

// Plant instance actions
export async function getPlantsByRow(rowId: number) {
  return await getPlantInstancesByRowId(rowId)
}

export async function addPlantToRow(rowId: number, plantId: number, position: number) {
  try {
    const plantInstance = await createPlantInstanceWithDetails(rowId, plantId, position)
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

export async function movePlantLeft(instanceId: number) {
  await movePlantInstanceLeft(instanceId)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function movePlantRight(instanceId: number) {
  await movePlantInstanceRight(instanceId)
  revalidatePath("/dashboard")
  return { success: true }
}
