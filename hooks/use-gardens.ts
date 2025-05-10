"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getGardens,
  createGarden as createGardenAction,
  updateGarden as updateGardenAction,
  deleteGarden as deleteGardenAction,
} from "@/lib/actions"

export interface Garden {
  id: number
  name: string
  user_id: number
}

export function useGardens() {
  const { toast } = useToast()
  const [gardens, setGardens] = useState<Garden[] | null>(null)
  const [selectedGarden, setSelectedGarden] = useState<Garden | null>(null)
  const [isLoadingGardens, setIsLoadingGardens] = useState(true)

  // Fetch gardens on component mount only
  useEffect(() => {
    let isMounted = true

    async function fetchGardens() {
      try {
        setIsLoadingGardens(true)
        const fetchedGardens = await getGardens()

        // Only update state if component is still mounted
        if (isMounted) {
          setGardens(fetchedGardens)

          // Select the first garden by default if available and no garden is selected
          if (fetchedGardens.length > 0 && !selectedGarden) {
            setSelectedGarden(fetchedGardens[0])
          }
        }
      } catch (error) {
        console.error("Error fetching gardens:", error)
        if (isMounted) {
          setGardens(null)
          toast({
            title: "Error",
            description: "Failed to load gardens. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingGardens(false)
        }
      }
    }

    fetchGardens()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
    // Empty dependency array - only runs once on mount
  }, [])

  // Create a new garden
  const createGarden = async (garden: { name: string }) => {
    try {
      const newGarden = await createGardenAction(garden.name)
      if (gardens) {
        const updatedGardens = [...gardens, newGarden]
        setGardens(updatedGardens)
        setSelectedGarden(newGarden)
      }
      toast({
        title: "Success",
        description: "Garden created successfully!",
      })
      return newGarden
    } catch (error) {
      console.error("Error creating garden:", error)
      toast({
        title: "Error",
        description: "Failed to create garden. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Update an existing garden
  const updateGarden = async (id: number, garden: { name: string }) => {
    try {
      const updatedGarden = await updateGardenAction(id, garden.name)
      if (gardens) {
        const updatedGardens = gardens.map((g) => (g.id === id ? updatedGarden : g))
        setGardens(updatedGardens)
        if (selectedGarden?.id === id) {
          setSelectedGarden(updatedGarden)
        }
      }
      toast({
        title: "Success",
        description: "Garden updated successfully!",
      })
      return updatedGarden
    } catch (error) {
      console.error("Error updating garden:", error)
      toast({
        title: "Error",
        description: "Failed to update garden. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Delete a garden
  const deleteGarden = async (id: number) => {
    try {
      await deleteGardenAction(id)
      if (gardens) {
        const updatedGardens = gardens.filter((g) => g.id !== id)
        setGardens(updatedGardens)
        if (selectedGarden?.id === id) {
          setSelectedGarden(updatedGardens.length > 0 ? updatedGardens[0] : null)
        }
      }
      toast({
        title: "Success",
        description: "Garden deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting garden:", error)
      toast({
        title: "Error",
        description: "Failed to delete garden. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    gardens,
    selectedGarden,
    setSelectedGarden,
    isLoadingGardens,
    createGarden,
    updateGarden,
    deleteGarden,
  }
}
