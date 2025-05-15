"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAllFlowers } from "@/lib/actions/flower-actions"
import { getFlowerUsageCounts } from "@/lib/actions"

export interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

export function usePlants(userId: number) {
  const { toast } = useToast()
  const [plants, setPlants] = useState<Plant[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load plants and usage counts
  useEffect(() => {
    const loadPlantsAndCounts = async () => {
      try {
        setIsLoading(true)
        const [allPlants, counts] = await Promise.all([getAllFlowers(userId), getFlowerUsageCounts()])

        const plantsWithCounts = allPlants.map((plant) => ({
          ...plant,
          quantity: plant.quantity || 1,
          used_count: counts[plant.id] || 0,
        }))

        setPlants(plantsWithCounts)
        setUsageCounts(counts)
      } catch (error) {
        console.error("Error loading plants:", error)
        toast({
          title: "Error",
          description: "Failed to load plants",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadPlantsAndCounts()
    }
  }, [toast, userId])

  const updatePlantUsage = (plantId: number, increment: boolean) => {
    // Update usage counts
    setUsageCounts((prevCounts) => {
      const currentCount = prevCounts[plantId] || 0
      return {
        ...prevCounts,
        [plantId]: increment ? currentCount + 1 : Math.max(0, currentCount - 1),
      }
    })

    // Update plants array with new used_count
    setPlants((prevPlants) =>
      prevPlants.map((p) => {
        if (p.id === plantId) {
          const currentUsed = p.used_count || 0
          return {
            ...p,
            used_count: increment ? currentUsed + 1 : Math.max(0, currentUsed - 1),
          }
        }
        return p
      }),
    )
  }

  const getAvailablePlants = () => {
    return plants.map((plant) => {
      const used = usageCounts[plant.id] || 0
      const quantity = plant.quantity || 0
      return {
        ...plant,
        available: Math.max(0, quantity - used),
      }
    })
  }

  return {
    plants,
    usageCounts,
    isLoading,
    updatePlantUsage,
    getAvailablePlants,
    setPlants,
    setUsageCounts,
  }
}
