"use client"

import { useState, useEffect } from "react"
import type { Plant } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { getAllFlowers, getFlowerUsageCounts } from "@/lib/actions"

export function usePlants(userId: number) {
  const { toast } = useToast()
  const [plants, setPlants] = useState<Plant[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load plants and usage counts
  useEffect(() => {
    const loadPlantsAndCounts = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        const [allPlants, counts] = await Promise.all([getAllFlowers(userId), getFlowerUsageCounts()])

        const plantsWithCounts = allPlants.map((plant) => ({
          ...plant,
          quantity: plant.quantity || 10,
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

    loadPlantsAndCounts()
  }, [toast, userId])

  const incrementPlantUsage = (plantId: number) => {
    setUsageCounts((prev) => ({
      ...prev,
      [plantId]: (prev[plantId] || 0) + 1,
    }))

    setPlants((prev) =>
      prev.map((p) => {
        if (p.id === plantId) {
          return {
            ...p,
            used_count: (p.used_count || 0) + 1,
          }
        }
        return p
      }),
    )
  }

  const decrementPlantUsage = (plantId: number) => {
    setUsageCounts((prev) => ({
      ...prev,
      [plantId]: Math.max(0, (prev[plantId] || 0) - 1),
    }))

    setPlants((prev) =>
      prev.map((p) => {
        if (p.id === plantId) {
          return {
            ...p,
            used_count: Math.max(0, (p.used_count || 0) - 1),
          }
        }
        return p
      }),
    )
  }

  const getAvailablePlants = () => {
    return plants.map((plant) => {
      const usedCount = usageCounts[plant.id] || 0
      const quantity = plant.quantity || 0
      const available = quantity - usedCount

      return {
        ...plant,
        available,
      }
    })
  }

  return {
    plants,
    usageCounts,
    isLoading,
    incrementPlantUsage,
    decrementPlantUsage,
    getAvailablePlants,
    setPlants,
    setUsageCounts,
  }
}
