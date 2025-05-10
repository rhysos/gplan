"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getAllFlowers,
  getFlowerUsageCounts,
  addPlantToRow as addPlantToRowAction,
  removePlantFromRow as removePlantFromRowAction,
  movePlantLeft as movePlantLeftAction,
  movePlantRight as movePlantRightAction,
} from "@/lib/actions"

export interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity: number
}

export interface PlantInstance {
  id: number
  row_id: number
  plant_id: number
  position: number
}

export function usePlants() {
  const { toast } = useToast()
  const [plants, setPlants] = useState<Plant[] | null>(null)
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({})
  const [isLoadingPlants, setIsLoadingPlants] = useState(true)

  // Fetch plants and usage counts on component mount
  useEffect(() => {
    let isMounted = true

    async function fetchPlantsAndCounts() {
      try {
        setIsLoadingPlants(true)
        const [fetchedPlants, fetchedCounts] = await Promise.all([
          getAllFlowers(1), // Assuming user ID 1 for now
          getFlowerUsageCounts(),
        ])

        if (isMounted) {
          setPlants(fetchedPlants)
          setUsageCounts(fetchedCounts)
        }
      } catch (error) {
        console.error("Error fetching plants:", error)
        if (isMounted) {
          setPlants(null)
          toast({
            title: "Error",
            description: "Failed to load plants. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlants(false)
        }
      }
    }

    fetchPlantsAndCounts()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array - only runs once on mount

  // Add a plant to a row
  const addPlantToRow = async (rowId: number, plantId: number, position: number) => {
    try {
      const result = await addPlantToRowAction(rowId, plantId, position)

      // Update usage counts
      setUsageCounts((prev) => ({
        ...prev,
        [plantId]: (prev[plantId] || 0) + 1,
      }))

      toast({
        title: "Success",
        description: "Plant added successfully!",
      })
      return result
    } catch (error) {
      console.error("Error adding plant to row:", error)
      toast({
        title: "Error",
        description: "Failed to add plant. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Remove a plant from a row
  const removePlantFromRow = async (plantInstanceId: number, plantId: number) => {
    try {
      await removePlantFromRowAction(plantInstanceId)

      // Update usage counts
      setUsageCounts((prev) => ({
        ...prev,
        [plantId]: Math.max(0, (prev[plantId] || 0) - 1),
      }))

      toast({
        title: "Success",
        description: "Plant removed successfully!",
      })
    } catch (error) {
      console.error("Error removing plant from row:", error)
      toast({
        title: "Error",
        description: "Failed to remove plant. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Move a plant left in a row
  const movePlantLeft = async (plantInstanceId: number) => {
    try {
      await movePlantLeftAction(plantInstanceId)
    } catch (error) {
      console.error("Error moving plant left:", error)
      toast({
        title: "Error",
        description: "Failed to move plant. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Move a plant right in a row
  const movePlantRight = async (plantInstanceId: number) => {
    try {
      await movePlantRightAction(plantInstanceId)
    } catch (error) {
      console.error("Error moving plant right:", error)
      toast({
        title: "Error",
        description: "Failed to move plant. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    plants: plants || [],
    isLoadingPlants,
    usageCounts,
    addPlantToRow,
    removePlantFromRow,
    movePlantLeft,
    movePlantRight,
  }
}
