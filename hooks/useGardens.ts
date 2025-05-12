"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getUserGardens, createUserGarden, updateUserGarden, deleteUserGarden } from "@/lib/actions"

export interface Garden {
  id: number
  name: string
}

export function useGardens(userId: number) {
  const { toast } = useToast()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [newGardenName, setNewGardenName] = useState("")
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null)

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

  const addGarden = async () => {
    if (newGardenName.trim() === "") return

    try {
      const newGarden = await createUserGarden(userId, newGardenName)

      setGardens([...gardens, newGarden])
      setCurrentGardenId(newGarden.id)

      setNewGardenName("")
      setIsAddingGarden(false)

      toast({
        title: "Garden created",
        description: `${newGarden.name} has been created successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create garden",
        variant: "destructive",
      })
    }
  }

  const deleteGarden = async (gardenId: number) => {
    if (gardens.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one garden",
        variant: "destructive",
      })
      return
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete garden",
        variant: "destructive",
      })
    }
  }

  const startEditGarden = (garden: Garden) => {
    setEditingGarden({ ...garden })
  }

  const saveGardenEdit = async () => {
    if (!editingGarden) return

    try {
      const updatedGarden = await updateUserGarden(editingGarden.id, userId, editingGarden.name)

      setGardens(gardens.map((g) => (g.id === editingGarden.id ? updatedGarden : g)))
      setEditingGarden(null)

      toast({
        title: "Garden updated",
        description: `${updatedGarden.name} has been updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update garden",
        variant: "destructive",
      })
    }
  }

  const currentGardenName = gardens.find((g) => g.id === currentGardenId)?.name || "Select Garden"

  return {
    gardens,
    currentGardenId,
    setCurrentGardenId,
    currentGardenName,
    isLoading,
    isAddingGarden,
    setIsAddingGarden,
    newGardenName,
    setNewGardenName,
    editingGarden,
    setEditingGarden,
    addGarden,
    deleteGarden,
    startEditGarden,
    saveGardenEdit,
  }
}
