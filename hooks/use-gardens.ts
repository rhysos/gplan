"use client"

import { useState, useEffect, useCallback } from "react"
import type { Garden } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { getUserGardens, createUserGarden, updateUserGarden, deleteUserGarden } from "@/lib/actions"

export function useGardens(userId: number) {
  const { toast } = useToast()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null)

  // Load user's gardens when component mounts
  useEffect(() => {
    async function loadGardens() {
      try {
        const userGardens = await getUserGardens(userId)
        setGardens(userGardens)

        if (userGardens.length > 0) {
          setCurrentGardenId(userGardens[0].id)
        }
      } catch (error) {
        console.error("Error loading gardens:", error)
        toast({
          title: "Error",
          description: "Failed to load gardens",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGardens()
  }, [userId, toast])

  const addGarden = async (name: string) => {
    if (name.trim() === "") return null

    try {
      const newGarden = await createUserGarden(userId, name)
      setGardens([...gardens, newGarden])
      setCurrentGardenId(newGarden.id)

      toast({
        title: "Garden created",
        description: `${newGarden.name} has been created successfully`,
      })

      return newGarden
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create garden",
        variant: "destructive",
      })
      return null
    }
  }

  const updateGarden = async (gardenId: number, name: string) => {
    try {
      const updatedGarden = await updateUserGarden(gardenId, userId, name)
      setGardens(gardens.map((g) => (g.id === gardenId ? updatedGarden : g)))

      toast({
        title: "Garden updated",
        description: `${updatedGarden.name} has been updated successfully`,
      })

      return updatedGarden
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update garden",
        variant: "destructive",
      })
      return null
    }
  }

  const removeGarden = async (gardenId: number) => {
    if (gardens.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one garden",
        variant: "destructive",
      })
      return false
    }

    try {
      await deleteUserGarden(gardenId, userId)
      const newGardens = gardens.filter((g) => g.id !== gardenId)
      setGardens(newGardens)

      if (gardenId === currentGardenId) {
        setCurrentGardenId(newGardens[0].id)
      }

      toast({
        title: "Garden deleted",
        description: "Garden has been deleted successfully",
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete garden",
        variant: "destructive",
      })
      return false
    }
  }

  const getCurrentGarden = useCallback(() => {
    return gardens.find((g) => g.id === currentGardenId) || null
  }, [gardens, currentGardenId])

  return {
    gardens,
    isLoading,
    currentGardenId,
    setCurrentGardenId,
    addGarden,
    updateGarden,
    removeGarden,
    getCurrentGarden,
  }
}
