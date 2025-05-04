"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Home,
  ChevronDown,
  LogOut,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  logoutUser,
  getUserGardens,
  createUserGarden,
  updateUserGarden,
  deleteUserGarden,
  getGardenRows,
  createGardenRow,
  updateGardenRow,
  deleteGardenRow,
  getPlants,
  getFlowerUsageCounts,
  getRowPlants,
  addPlantToRow as serverAddPlantToRow,
  removePlantFromRow,
} from "@/lib/actions"
import { Badge } from "./ui/badge"

// Types
interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

interface PlantInstance {
  id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string | null
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null
}

// Update the GardenRow interface to include row_ends as a number
interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: PlantInstance[]
  isActive?: boolean
}

interface Garden {
  id: number
  name: string
}

export default function GardenPlanner({ userId }: { userId: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null)
  const [rows, setRows] = useState<GardenRow[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({})
  const [addingPlantLoading, setAddingPlantLoading] = useState<number | null>(null)
  const [movingPlant, setMovingPlant] = useState<boolean>(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [newGardenName, setNewGardenName] = useState("")
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null)

  const [isAddingRow, setIsAddingRow] = useState(false)
  const [newRowName, setNewRowName] = useState("")
  const [newRowLength, setNewRowLength] = useState(240) // 2.4 meters default
  const [newRowEnds, setNewRowEnds] = useState(0) // Default to 0
  const [editingRow, setEditingRow] = useState<GardenRow | null>(null)

  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)
  const [addingPlantToRowId, setAddingPlantToRowId] = useState<number | null>(null)
  const [isAddPlantDialogOpen, setIsAddPlantDialogOpen] = useState(false)

  // Clean up any animation timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  // Load user's gardens
  useEffect(() => {
    const loadGardens = async () => {
      try {
        const userGardens = await getUserGardens(userId)
        setGardens(userGardens)

        if (userGardens.length > 0) {
          setCurrentGardenId(userGardens[0].id)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your gardens",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGardens()
  }, [userId, toast])

  // Load plants and usage counts
  useEffect(() => {
    const loadPlantsAndCounts = async () => {
      try {
        const [allPlants, counts] = await Promise.all([getPlants(), getFlowerUsageCounts()])

        // Combine plants with usage counts and ensure quantity is set
        const plantsWithCounts = allPlants.map((plant) => ({
          ...plant,
          quantity: plant.quantity || 10, // Default to 10 if not set
          used_count: counts[plant.id] || 0,
        }))

        setPlants(plantsWithCounts)
        setUsageCounts(counts)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load plants",
          variant: "destructive",
        })
      }
    }

    loadPlantsAndCounts()
  }, [toast])

  // Load rows when garden changes
  const loadRows = useCallback(async () => {
    if (!currentGardenId) return

    try {
      const gardenRows = await getGardenRows(currentGardenId)

      // Load plants for each row
      const rowsWithPlants = await Promise.all(
        gardenRows.map(async (row) => {
          try {
            const plants = await getRowPlants(row.id)
            return {
              ...row,
              plants: plants || [],
              // Ensure row_ends is a number
              row_ends: typeof row.row_ends === "number" ? row.row_ends : 0,
            }
          } catch (error) {
            console.error(`Error loading plants for row ${row.id}:`, error)
            return { ...row, plants: [], row_ends: 0 }
          }
        }),
      )

      setRows(rowsWithPlants)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load garden rows",
        variant: "destructive",
      })
    }
  }, [currentGardenId, toast])

  useEffect(() => {
    loadRows()
  }, [currentGardenId, loadRows])

  // Garden Management
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

      // If we deleted the current garden, switch to the first available
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

  // Row Management
  const addRow = async () => {
    if (newRowName.trim() === "" || !currentGardenId) return

    try {
      const newRow = await createGardenRow(currentGardenId, newRowName, newRowLength, newRowEnds)
      setRows([...rows, { ...newRow, plants: [] }])
      setNewRowName("")
      setNewRowLength(240)
      setNewRowEnds(0)
      setIsAddingRow(false)

      toast({
        title: "Row added",
        description: `${newRow.name} has been added successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive",
      })
    }
  }

  const deleteRow = async (rowId: number) => {
    try {
      await deleteGardenRow(rowId)
      setRows(rows.filter((row) => row.id !== rowId))

      toast({
        title: "Row deleted",
        description: "Row has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      })
    }
  }

  const startEditRow = (row: GardenRow) => {
    setEditingRow({ ...row })
  }

  const saveRowEdit = async () => {
    if (!editingRow) return

    try {
      const updatedRow = await updateGardenRow(editingRow.id, editingRow.name, editingRow.length, editingRow.row_ends)
      setRows(rows.map((row) => (row.id === editingRow.id ? { ...updatedRow, plants: row.plants } : row)))
      setEditingRow(null)

      toast({
        title: "Row updated",
        description: `${updatedRow.name} has been updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive",
      })
    }
  }

  // Plant Management
  const addPlantToRow = async (rowId: number) => {
    if (!selectedPlant) return

    const row = rows.find((r) => r.id === rowId)
    if (!row) return

    const plant = plants.find((p) => p.id === selectedPlant)
    if (!plant) return

    // Check if there are enough plants available
    const usedCount = usageCounts[plant.id] || 0
    const quantity = plant.quantity || 10 // Default to 10 if not set

    if (usedCount >= quantity) {
      toast({
        title: "Not enough plants",
        description: `You don't have any more ${plant.name} available`,
        variant: "destructive",
      })
      return
    }

    // Find the next available position
    let position = row.row_ends || 0 // Start at row_ends distance from the edge
    const rowPlants = row.plants || []
    const sortedPlants = [...rowPlants].sort((a, b) => a.position - b.position)

    if (sortedPlants.length > 0) {
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      position = lastPlant.position + lastPlant.spacing
    }

    // Calculate used space including the new plant
    const usedSpace = calculateUsedSpace(row, plant)

    // Check if there's enough space at the end of the row
    if (usedSpace > row.length) {
      toast({
        title: "Not enough space",
        description: "There's not enough space in this row for this flower",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingPlantLoading(rowId)

      // Highlight the active row
      setRows(
        rows.map((r) => ({
          ...r,
          isActive: r.id === rowId,
        })),
      )

      // Optimistically update the UI with animation state
      const optimisticPlantInstance: PlantInstance = {
        id: -1, // Temporary ID
        plant_id: selectedPlant,
        position: position,
        name: plant.name,
        spacing: plant.spacing,
        image_url: plant.image_url,
        animationState: "entering",
      }

      // Update the UI immediately
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [...(r.plants || []), optimisticPlantInstance],
            }
          }
          return r
        }),
      )

      // Update usage counts optimistically
      setUsageCounts({
        ...usageCounts,
        [plant.id]: (usageCounts[plant.id] || 0) + 1,
      })

      // Update plants with new usage count
      setPlants(
        plants.map((p) => {
          if (p.id === plant.id) {
            return {
              ...p,
              used_count: (p.used_count || 0) + 1,
            }
          }
          return p
        }),
      )

      // Close the dialog immediately
      setIsAddPlantDialogOpen(false)
      setSelectedPlant(null)

      // Make the actual server call
      const newPlantInstance = await serverAddPlantToRow(rowId, selectedPlant, position)

      // Update with the real data from the server
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [
                ...(r.plants || []).filter((p) => p.id !== -1), // Remove the optimistic entry
                { ...newPlantInstance, animationState: "entering" },
              ],
            }
          }
          return r
        }),
      )

      // Clear animation state after animation completes
      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
            plants: r.plants?.map((p) => ({
              ...p,
              animationState: null,
            })),
          })),
        )
      }, 500)

      toast({
        title: "Flower added",
        description: `${plant.name} has been added to the row`,
      })
    } catch (error) {
      // Revert the optimistic update on error
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: (r.plants || []).filter((p) => p.id !== -1),
              isActive: false,
            }
          }
          return r
        }),
      )

      // Revert usage count update
      setUsageCounts({
        ...usageCounts,
        [plant.id]: (usageCounts[plant.id] || 0) - 1,
      })

      // Revert plants usage count update
      setPlants(
        plants.map((p) => {
          if (p.id === plant.id) {
            return {
              ...p,
              used_count: Math.max(0, (p.used_count || 0) - 1),
            }
          }
          return p
        }),
      )

      toast({
        title: "Error",
        description: "Failed to add flower",
        variant: "destructive",
      })
    } finally {
      setAddingPlantLoading(null)
    }
  }

  const removePlant = async (rowId: number, plantInstanceId: number, plantId: number) => {
    try {
      // Mark the plant as exiting for animation
      setRows(
        rows.map((row) => {
          if (row.id === rowId) {
            return {
              ...row,
              isActive: true,
              plants: (row.plants || []).map((p) =>
                p.id === plantInstanceId ? { ...p, animationState: "exiting" } : p,
              ),
            }
          }
          return row
        }),
      )

      // Wait for animation to complete before removing from UI
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Optimistically update UI
      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            plants: (row.plants || []).filter((p) => p.id !== plantInstanceId),
          }
        }
        return row
      })
      setRows(updatedRows)

      // Update usage counts optimistically
      setUsageCounts({
        ...usageCounts,
        [plantId]: Math.max(0, (usageCounts[plantId] || 0) - 1),
      })

      // Update plants with new usage count
      setPlants(
        plants.map((p) => {
          if (p.id === plantId) {
            return {
              ...p,
              used_count: Math.max(0, (p.used_count || 0) - 1),
            }
          }
          return p
        }),
      )

      // Make the server call
      await removePlantFromRow(plantInstanceId)

      // Reset active state after a delay
      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
          })),
        )
      }, 500)

      toast({
        title: "Flower removed",
        description: "Flower has been removed successfully",
      })
    } catch (error) {
      // If there's an error, reload the rows to get the correct state
      loadRows()

      toast({
        title: "Error",
        description: "Failed to remove flower",
        variant: "destructive",
      })
    }
  }

  // Function to move a plant left or right in a row
  const movePlant = async (rowId: number, plantIndex: number, direction: "left" | "right") => {
    const row = rows.find((r) => r.id === rowId)
    if (!row || !row.plants) return

    const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

    // Don't allow first plant to move left or last plant to move right
    if (
      (direction === "left" && plantIndex === 0) ||
      (direction === "right" && plantIndex === sortedPlants.length - 1)
    ) {
      return
    }

    setMovingPlant(true)

    try {
      // Set animation state for the plants being moved
      const updatedRows = rows.map((r) => {
        if (r.id === rowId) {
          const updatedPlants = [...sortedPlants]

          if (direction === "left") {
            updatedPlants[plantIndex].animationState = "moving-left"
            updatedPlants[plantIndex - 1].animationState = "moving-right"
          } else {
            updatedPlants[plantIndex].animationState = "moving-right"
            updatedPlants[plantIndex + 1].animationState = "moving-left"
          }

          return {
            ...r,
            isActive: true,
            plants: updatedPlants,
          }
        }
        return r
      })

      setRows(updatedRows)

      // Wait for animation to start
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Calculate new positions
      let newPositions: PlantInstance[] = []

      if (direction === "left") {
        // Swap with the plant to the left
        const currentPlant = sortedPlants[plantIndex]
        const leftPlant = sortedPlants[plantIndex - 1]

        // Swap positions
        const tempPosition = currentPlant.position
        currentPlant.position = leftPlant.position
        leftPlant.position = tempPosition

        newPositions = sortedPlants
      } else {
        // Swap with the plant to the right
        const currentPlant = sortedPlants[plantIndex]
        const rightPlant = sortedPlants[plantIndex + 1]

        // Swap positions
        const tempPosition = currentPlant.position
        currentPlant.position = rightPlant.position
        rightPlant.position = tempPosition

        newPositions = sortedPlants
      }

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Update the UI with new positions but clear animation states
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: newPositions.map((p) => ({
                ...p,
                animationState: null,
              })),
            }
          }
          return r
        }),
      )

      // Reset active state after a delay
      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
          })),
        )
      }, 200)

      toast({
        title: "Plant moved",
        description: `Plant moved ${direction}`,
      })
    } catch (error) {
      // Revert on error
      loadRows()

      toast({
        title: "Error",
        description: `Failed to move plant ${direction}`,
        variant: "destructive",
      })
    } finally {
      setMovingPlant(false)
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  // Calculate used space in a row, including row_ends on both sides and using the larger spacing between plants
  const calculateUsedSpace = useCallback((row: GardenRow, newPlant?: Plant): number => {
    // Start with row_ends on both sides
    let totalSpace = 2 * (row.row_ends || 0)

    if (!row.plants || !Array.isArray(row.plants) || row.plants.length === 0) {
      // If there are no plants, just return the row_ends on both sides
      return totalSpace
    }

    // Sort plants by position
    const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

    // If we're adding a new plant, add it to the sorted plants
    if (newPlant) {
      // Find the position for the new plant
      let position = row.row_ends || 0 // Start at row_ends distance from the edge
      if (sortedPlants.length > 0) {
        const lastPlant = sortedPlants[sortedPlants.length - 1]
        position = lastPlant.position + lastPlant.spacing
      }

      sortedPlants.push({
        id: -1,
        plant_id: -1,
        position,
        name: newPlant.name,
        spacing: newPlant.spacing,
        image_url: newPlant.image_url,
      })
    }

    if (sortedPlants.length === 1) {
      // If there's only one plant, just add its spacing
      totalSpace += sortedPlants[0].spacing
    } else if (sortedPlants.length > 1) {
      // For multiple plants, calculate the total space used by all plants
      // The total space is the position of the last plant plus its spacing, minus the position of the first plant
      const firstPlant = sortedPlants[0]
      const lastPlant = sortedPlants[sortedPlants.length - 1]

      // Total space used by plants = (last plant position + last plant spacing) - first plant position
      const plantsSpace = lastPlant.position + lastPlant.spacing - firstPlant.position
      totalSpace += plantsSpace
    }

    return totalSpace
  }, [])

  // Calculate the percentage of used space in a row
  const calculateUsedPercentage = useCallback(
    (row: GardenRow): number => {
      const usedSpace = calculateUsedSpace(row)
      return Math.min(100, Math.round((usedSpace / row.length) * 100))
    },
    [calculateUsedSpace],
  )

  // Check if a plant would fit in a row
  const wouldPlantFit = useCallback(
    (row: GardenRow, plant: Plant): boolean => {
      const usedSpace = calculateUsedSpace(row, plant)
      return usedSpace <= row.length
    },
    [calculateUsedSpace],
  )

  // Memoize the current garden name
  const currentGardenName = useMemo(() => {
    return gardens.find((g) => g.id === currentGardenId)?.name || "Select Garden"
  }, [gardens, currentGardenId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your gardens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with Garden Selector */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Garden Planner</h1>

        <div className="flex items-center gap-2">
          {gardens.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}
                >
                  <Home size={16} />
                  {currentGardenName}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {gardens.map((garden) => (
                  <DropdownMenuItem
                    key={garden.id}
                    onClick={() => setCurrentGardenId(garden.id)}
                    className={garden.id === currentGardenId ? "bg-secondary" : ""}
                  >
                    {garden.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setIsAddingGarden(true)}>
                  <Plus size={16} className="mr-2" />
                  Add New Garden
                </DropdownMenuItem>
                {gardens.length > 1 && currentGardenId && (
                  <DropdownMenuItem onClick={() => deleteGarden(currentGardenId)} className="text-destructive">
                    <Trash2 size={16} className="mr-2" />
                    Delete Current Garden
                  </DropdownMenuItem>
                )}
                {currentGardenId && (
                  <DropdownMenuItem onClick={() => startEditGarden(gardens.find((g) => g.id === currentGardenId)!)}>
                    <Edit size={16} className="mr-2" />
                    Rename Garden
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" style={{ color: "var(--ebony)" }}>
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Add Garden Dialog */}
      <Dialog open={isAddingGarden} onOpenChange={setIsAddingGarden}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Garden</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="garden-name">Garden Name</Label>
              <Input
                id="garden-name"
                value={newGardenName}
                onChange={(e) => setNewGardenName(e.target.value)}
                placeholder="e.g., Backyard Garden"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addGarden} style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}>
              Create Garden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Garden Dialog */}
      {editingGarden && (
        <Dialog open={!!editingGarden} onOpenChange={(open) => !open && setEditingGarden(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Garden</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-garden-name">Garden Name</Label>
                <Input
                  id="edit-garden-name"
                  value={editingGarden.name}
                  onChange={(e) => setEditingGarden({ ...editingGarden, name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveGardenEdit} style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}>
                <Save size={16} className="mr-1" /> Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* No Gardens State */}
      {gardens.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "var(--celadon)" }}>
          <p className="text-muted-foreground mb-4">You don't have any gardens yet.</p>
          <Button
            onClick={() => setIsAddingGarden(true)}
            style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}
          >
            <Plus size={16} className="mr-2" />
            Create Your First Garden
          </Button>
        </div>
      ) : (
        <>
          {/* Add Row Button */}
          <div className="mb-8">
            <Dialog open={isAddingRow} onOpenChange={setIsAddingRow}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "var(--light-blue)", color: 'var(--ebony)" }}, color: "var(--ebony)' }}
                >
                  <Plus size={16} />
                  Add Garden Row
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Garden Row</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="row-name">Row Name</Label>
                    <Input
                      id="row-name"
                      value={newRowName}
                      onChange={(e) => setNewRowName(e.target.value)}
                      placeholder="e.g., Tulip Row"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="row-length">Row Length (cm)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="row-length"
                        value={[newRowLength]}
                        onValueChange={(value) => setNewRowLength(value[0])}
                        min={30}
                        max={600}
                        step={30}
                        className="flex-1"
                      />
                      <span className="w-16 text-right">
                        {newRowLength} cm ({(newRowLength / 100).toFixed(1)} m)
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="row-ends">Row Ends (cm)</Label>
                    <Input
                      id="row-ends"
                      type="number"
                      min="0"
                      value={newRowEnds}
                      onChange={(e) => setNewRowEnds(Number(e.target.value))}
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Space from the edge to the first/last plant in the row
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addRow} style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}>
                    Add Row
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Garden Rows */}
          <div className="space-y-8">
            {rows.length === 0 ? (
              <div
                className="text-center py-12 border-2 border-dashed rounded-lg"
                style={{ borderColor: "var(--celadon)" }}
              >
                <p className="text-muted-foreground">
                  No garden rows yet in {currentGardenName}. Add your first row to get started!
                </p>
              </div>
            ) : (
              rows.map((row) => {
                const usedSpace = calculateUsedSpace(row)
                const usedPercentage = calculateUsedPercentage(row)
                const availableSpace = row.length - usedSpace

                return (
                  <div
                    key={row.id}
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      row.isActive ? "row-highlight" : ""
                    }`}
                    style={{ borderColor: row.isActive ? "var(--sunglow)" : "var(--cadet-gray)" }}
                  >
                    {/* Row Header */}
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold">{row.name}</h2>
                        </div>
                        <div className="flex gap-2">
                          <Dialog
                            open={isAddPlantDialogOpen && addingPlantToRowId === row.id}
                            onOpenChange={(open) => {
                              setIsAddPlantDialogOpen(open)
                              if (!open) setAddingPlantToRowId(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAddingPlantToRowId(row.id)
                                  setIsAddPlantDialogOpen(true)
                                }}
                                disabled={addingPlantLoading === row.id}
                                style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}
                              >
                                {addingPlantLoading === row.id ? (
                                  <>
                                    <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-t-transparent" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus size={16} className="mr-1" /> Add Flower
                                  </>
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Flower to {row.name}</DialogTitle>
                              </DialogHeader>
                              <div className="py-2">
                                <div className="space-y-1">
                                  <Label htmlFor="plant-select">Select a flower to add:</Label>
                                  <div className="mt-1 max-h-[300px] overflow-y-auto border rounded-md">
                                    {plants.map((plant) => {
                                      const quantity = plant.quantity || 10
                                      const usedCount = usageCounts[plant.id] || 0
                                      const available = quantity - usedCount
                                      const canFit = wouldPlantFit(row, plant)
                                      const isDisabled = available <= 0 || !canFit

                                      return (
                                        <div
                                          key={plant.id}
                                          onClick={() => {
                                            if (!isDisabled && !addingPlantLoading) {
                                              setSelectedPlant(plant.id)
                                              // Automatically add the plant when selected
                                              setTimeout(() => {
                                                addPlantToRow(row.id)
                                              }, 100)
                                            }
                                          }}
                                          className={`flex items-center gap-2 p-2 hover:bg-muted/20 cursor-pointer border-b last:border-b-0 transition-colors ${
                                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                                          }`}
                                        >
                                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                            <CloudinaryImage
                                              src={plant.image_url}
                                              alt={plant.name}
                                              width={40}
                                              height={40}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                              <span className="font-medium truncate">{plant.name}</span>
                                              <Badge
                                                variant={available > 0 ? "outline" : "destructive"}
                                                className="ml-2"
                                              >
                                                {available} left
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              Spacing: {plant.spacing} cm
                                            </div>
                                          </div>
                                          {!canFit && (
                                            <div className="text-amber-500 flex items-center text-xs">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Won't fit
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                                {addingPlantLoading && (
                                  <div className="flex items-center justify-center mt-4">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                                    <span>Adding flower...</span>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditRow(row)}
                            style={{ borderColor: "var(--light-blue)", color: "var(--ebony)" }}
                          >
                            <Edit size={16} className="mr-1" /> Edit
                          </Button>

                          <Button variant="destructive" size="sm" onClick={() => deleteRow(row.id)}>
                            <Trash2 size={16} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </div>

                      {/* Detailed Row Information */}
                      <div
                        className="grid grid-cols-4 gap-2 text-sm p-2 rounded-md"
                        style={{ backgroundColor: "rgba(138, 161, 177, 0.1)" }}
                      >
                        <div>
                          <span className="font-medium">Length:</span> {row.length} cm
                        </div>
                        <div>
                          <span className="font-medium">Row ends:</span> {row.row_ends} cm
                        </div>
                        <div>
                          <span className="font-medium">Plants:</span> {(row.plants || []).length}
                        </div>
                        <div>
                          <span className="font-medium">Space used:</span> {calculateUsedSpace(row)} cm
                        </div>
                      </div>
                    </div>

                    {/* Remove the old text that showed this information */}
                    {/* <p className="text-sm text-muted-foreground">
                      {row.length} cm ({(row.length / 100).toFixed(1)} m) • {usedSpace} cm used •{availableSpace} cm
                      available • Row ends: {row.row_ends} cm
                    </p> */}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <Progress
                                value={usedPercentage}
                                className={usedPercentage > 90 ? "bg-opacity-20" : ""}
                                indicatorClassName={usedPercentage > 90 ? "bg-sunglow" : ""}
                                style={{
                                  backgroundColor:
                                    usedPercentage > 90 ? "rgba(255, 203, 71, 0.2)" : "rgba(154, 194, 201, 0.2)",
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{usedPercentage}% of row space used</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Row Visualization */}
                    <div
                      className="relative h-48 rounded-lg overflow-x-auto"
                      style={{ backgroundColor: "rgba(185, 216, 194, 0.1)" }}
                    >
                      <div
                        className="absolute top-0 left-0 h-full flex items-center"
                        style={{ width: `${row.length * 3}px`, minWidth: "100%" }}
                      >
                        {/* Ruler markings */}
                        {Array.from({ length: Math.ceil(row.length / 100) + 1 }).map((_, i) => (
                          <div key={i} className="absolute h-full" style={{ left: `${i * 300}px` }}>
                            <div
                              className="absolute bottom-0 h-4 border-l"
                              style={{ borderColor: "var(--cadet-gray)" }}
                            ></div>
                            <div
                              className="absolute bottom-0 text-xs"
                              style={{ left: "4px", color: "var(--cadet-gray)" }}
                            >
                              {i}m
                            </div>
                          </div>
                        ))}

                        {/* Row ends visualization */}
                        {row.row_ends > 0 && (
                          <>
                            {/* Left end */}
                            <div
                              className="absolute top-2 bottom-6 border border-dashed"
                              style={{
                                left: 0,
                                width: `${row.row_ends * 3}px`,
                                backgroundColor: "rgba(138, 161, 177, 0.2)",
                                borderColor: "var(--cadet-gray)",
                              }}
                            >
                              <div className="h-full flex items-center justify-center">
                                <span className="text-xs rotate-90" style={{ color: "var(--cadet-gray)" }}>
                                  Row end
                                </span>
                              </div>
                            </div>

                            {/* Right end */}
                            <div
                              className="absolute top-2 bottom-6 border border-dashed"
                              style={{
                                right: 0,
                                width: `${row.row_ends * 3}px`,
                                backgroundColor: "rgba(138, 161, 177, 0.2)",
                                borderColor: "var(--cadet-gray)",
                              }}
                            >
                              <div className="h-full flex items-center justify-center">
                                <span className="text-xs rotate-90" style={{ color: "var(--cadet-gray)" }}>
                                  Row end
                                </span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Plants */}
                        {(row.plants || [])
                          .filter((plantInstance) => plantInstance && typeof plantInstance === "object")
                          .sort((a, b) => a.position - b.position)
                          .map((plantInstance, index, sortedPlants) => {
                            const isFirst = index === 0
                            const isLast = index === sortedPlants.length - 1

                            // Determine animation class based on animation state
                            let animationClass = ""
                            if (plantInstance.animationState === "entering") animationClass = "plant-enter"
                            if (plantInstance.animationState === "exiting") animationClass = "plant-exit"
                            if (plantInstance.animationState === "moving-left") animationClass = "plant-move-left"
                            if (plantInstance.animationState === "moving-right") animationClass = "plant-move-right"

                            return (
                              <div
                                key={plantInstance.id}
                                className="absolute top-2 bottom-6 group"
                                style={{
                                  left: `${plantInstance.position * 3}px`,
                                  width: `${(plantInstance.spacing || 0) * 3}px`,
                                }}
                              >
                                <div
                                  className={`h-full flex flex-col relative bg-white rounded-md overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md ${animationClass}`}
                                  style={{ borderColor: "var(--cadet-gray)" }}
                                >
                                  {/* Larger image */}
                                  <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                                    <CloudinaryImage
                                      src={plantInstance.image_url || "/placeholder.svg?height=80&width=80"}
                                      alt={plantInstance.name || "Flower"}
                                      width={120}
                                      height={120}
                                      objectFit="cover"
                                      className="w-full h-full object-cover"
                                    />

                                    {/* Hover actions overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      {/* Move left button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 rounded-full bg-white/80 ${isFirst ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => !isFirst && !movingPlant && movePlant(row.id, index, "left")}
                                        disabled={isFirst || movingPlant}
                                        style={{ color: "var(--ebony)" }}
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </Button>

                                      {/* Delete button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-white/80 text-red-600 hover:bg-red-100"
                                        onClick={() => removePlant(row.id, plantInstance.id, plantInstance.plant_id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>

                                      {/* Move right button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 rounded-full bg-white/80 ${isLast ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => !isLast && !movingPlant && movePlant(row.id, index, "right")}
                                        disabled={isLast || movingPlant}
                                        style={{ color: "var(--ebony)" }}
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Caption */}
                                  <div
                                    className="p-1 text-center"
                                    style={{ backgroundColor: "rgba(138, 161, 177, 0.2)" }}
                                  >
                                    <p className="text-xs truncate" style={{ color: "var(--cadet-gray)" }}>
                                      {plantInstance.name || "Unknown Flower"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Edit Row Dialog */}
      {editingRow && (
        <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Row</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-row-name">Row Name</Label>
                <Input
                  id="edit-row-name"
                  value={editingRow.name}
                  onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-row-length">Row Length (cm)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="edit-row-length"
                    value={[editingRow.length]}
                    onValueChange={(value) => setEditingRow({ ...editingRow, length: value[0] })}
                    min={30}
                    max={600}
                    step={30}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">
                    {editingRow.length} cm ({(editingRow.length / 100).toFixed(1)} m)
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-row-ends">Row Ends (cm)</Label>
                <Input
                  id="edit-row-ends"
                  type="number"
                  min="0"
                  value={editingRow.row_ends || 0}
                  onChange={(e) => setEditingRow({ ...editingRow, row_ends: Number(e.target.value) })}
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-muted-foreground">Space from the edge to the first/last plant in the row</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveRowEdit} style={{ backgroundColor: "var(--celadon)", color: "var(--ebony)" }}>
                <Save size={16} className="mr-1" /> Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
