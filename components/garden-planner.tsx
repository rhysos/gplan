"use client"

// Import necessary React hooks and utilities
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Home } from "lucide-react"

// Import UI components
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { InstructionsPanel } from "@/components/dashboard/instructions-panel"
import { GardenPlannerHeader } from "@/components/garden-planner-header"
import { GardenRows } from "@/components/garden-rows"

// Import dialog components
import { AddGardenDialog } from "@/components/dialogs/add-garden-dialog"
import { EditGardenDialog } from "@/components/dialogs/edit-garden-dialog"
import { AddRowDialog } from "@/components/dialogs/add-row-dialog"
import { EditRowDialog } from "@/components/dialogs/edit-row-dialog"
import { AddPlantDialog } from "@/components/dialogs/add-plant-dialog"

// Import server actions
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
  getFlowerUsageCounts,
  getRowPlants,
  addPlantToRow as serverAddPlantToRow,
  removePlantFromRow,
} from "@/lib/actions"
import { getAllFlowers } from "@/lib/actions/flower-actions"

// TypeScript interfaces
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

// Main component
export default function GardenPlanner({ userId }: { userId: number }) {
  const router = useRouter()
  const { toast } = useToast()

  // State for gardens data and UI
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // State for UI controls
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)

  // State for rows and plants
  const [rows, setRows] = useState<GardenRow[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({})

  // UI state for plant operations
  const [addingPlantLoading, setAddingPlantLoading] = useState<number | null>(null)
  const [movingPlant, setMovingPlant] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Ref to store animation timeouts for cleanup
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State for garden management UI
  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [newGardenName, setNewGardenName] = useState("")
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null)

  // State for row management UI
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [newRowName, setNewRowName] = useState("")
  const [newRowLength, setNewRowLength] = useState(240)
  const [newRowEnds, setNewRowEnds] = useState(0)
  const [editingRow, setEditingRow] = useState<GardenRow | null>(null)

  // State for plant management UI
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

  // Load plants and usage counts
  useEffect(() => {
    const loadPlantsAndCounts = async () => {
      try {
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
      }
    }

    if (userId) {
      loadPlantsAndCounts()
    }
  }, [toast, userId])

  // Load rows when garden changes
  const loadRows = useCallback(async () => {
    if (!currentGardenId) return

    try {
      const gardenRows = await getGardenRows(currentGardenId)

      const rowsWithPlants = await Promise.all(
        gardenRows.map(async (row) => {
          try {
            const plants = await getRowPlants(row.id)
            return {
              ...row,
              plants: plants || [],
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

  // Call loadRows when currentGardenId changes
  useEffect(() => {
    loadRows()
  }, [currentGardenId, loadRows])

  // Garden Management Functions
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

  // Row Management Functions
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

  // Plant Management Functions
  const addPlantToRow = async (rowId: number) => {
    if (!selectedPlant) return

    const row = rows.find((r) => r.id === rowId)
    if (!row) return

    const plant = plants.find((p) => p.id === selectedPlant)
    if (!plant) return

    const usedCount = usageCounts[plant.id] || 0
    const quantity = plant.quantity || 1

    if (usedCount >= quantity) {
      toast({
        title: "Not enough plants",
        description: `You don't have any more ${plant.name} available`,
        variant: "destructive",
      })
      return
    }

    let position = row.row_ends || 0
    const rowPlants = row.plants || []
    const sortedPlants = [...rowPlants].sort((a, b) => a.position - b.position)

    if (sortedPlants.length > 0) {
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      position = lastPlant.position + lastPlant.spacing
    }

    const usedSpace = calculateUsedSpace(row, plant)

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

      setRows(
        rows.map((r) => ({
          ...r,
          isActive: r.id === rowId,
        })),
      )

      const optimisticPlantInstance: PlantInstance = {
        id: -1,
        plant_id: selectedPlant,
        position: position,
        name: plant.name,
        spacing: plant.spacing,
        image_url: plant.image_url,
        animationState: "entering",
      }

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

      setUsageCounts({
        ...usageCounts,
        [plant.id]: (usageCounts[plant.id] || 0) + 1,
      })

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

      setIsAddPlantDialogOpen(false)
      setSelectedPlant(null)

      const newPlantInstance = await serverAddPlantToRow(rowId, selectedPlant, position)

      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [
                ...(r.plants || []).filter((p) => p.id !== -1),
                { ...newPlantInstance, animationState: "entering" },
              ],
            }
          }
          return r
        }),
      )

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
      }, 800)

      toast({
        title: "Flower added",
        description: `${plant.name} has been added to the row`,
      })
    } catch (error) {
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

      setUsageCounts({
        ...usageCounts,
        [plant.id]: (usageCounts[plant.id] || 0) - 1,
      })

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

      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          const remainingPlants = (row.plants || [])
            .filter((p) => p.id !== plantInstanceId)
            .sort((a, b) => a.position - b.position)

          let currentPosition = row.row_ends || 0
          const updatedPlants = remainingPlants.map((plant) => {
            const updatedPlant = {
              ...plant,
              position: currentPosition,
            }
            currentPosition += plant.spacing
            return updatedPlant
          })

          return {
            ...row,
            plants: updatedPlants,
          }
        }
        return row
      })
      setRows(updatedRows)

      await removePlantFromRow(plantInstanceId)

      setUsageCounts((prevCounts) => ({
        ...prevCounts,
        [plantId]: Math.max(0, (prevCounts[plantId] || 0) - 1),
      }))

      setPlants((prevPlants) =>
        prevPlants.map((p) => {
          if (p.id === plantId) {
            return {
              ...p,
              used_count: Math.max(0, (p.used_count || 0) - 1),
            }
          }
          return p
        }),
      )

      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
          })),
        )
      }, 800)

      toast({
        title: "Flower removed",
        description: "Flower has been removed successfully",
      })
    } catch (error) {
      loadRows()

      toast({
        title: "Error",
        description: "Failed to remove flower",
      })
    }
  }

  const movePlant = async (rowId: number, plantIndex: number, direction: "left" | "right") => {
    const row = rows.find((r) => r.id === rowId)
    if (!row || !row.plants) return

    const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

    if (
      (direction === "left" && plantIndex === 0) ||
      (direction === "right" && plantIndex === sortedPlants.length - 1)
    ) {
      return
    }

    setMovingPlant(true)

    try {
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

      await new Promise((resolve) => setTimeout(resolve, 100))

      let newPositions: PlantInstance[] = []

      if (direction === "left") {
        const currentPlant = sortedPlants[plantIndex]
        const leftPlant = sortedPlants[plantIndex - 1]

        const tempPosition = currentPlant.position
        currentPlant.position = leftPlant.position
        leftPlant.position = tempPosition

        newPositions = sortedPlants
      } else {
        const currentPlant = sortedPlants[plantIndex]
        const rightPlant = sortedPlants[plantIndex + 1]

        const tempPosition = currentPlant.position
        currentPlant.position = rightPlant.position
        rightPlant.position = tempPosition

        newPositions = sortedPlants
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

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

      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
          })),
        )
      }, 800)

      toast({
        title: "Plant moved",
        description: `Plant moved ${direction}`,
      })
    } catch (error) {
      loadRows()

      toast({
        title: "Error",
        description: `Failed to move plant ${direction}`,
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

  // Calculate used space in a row
  const calculateUsedSpace = useCallback((row: GardenRow, newPlant?: Plant): number => {
    let totalSpace = 2 * (row.row_ends || 0)

    if (!row.plants || !Array.isArray(row.plants) || row.plants.length === 0) {
      return totalSpace
    }

    const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

    if (newPlant) {
      let position = row.row_ends || 0
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
      totalSpace += sortedPlants[0].spacing
    } else if (sortedPlants.length > 1) {
      const firstPlant = sortedPlants[0]
      const lastPlant = sortedPlants[sortedPlants.length - 1]

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

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading your gardens...</p>
        </div>
      </div>
    )
  }

  // Main component render
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Garden Planner Header */}
      <GardenPlannerHeader
        gardens={gardens}
        currentGardenId={currentGardenId}
        setCurrentGardenId={setCurrentGardenId}
        currentGardenName={currentGardenName}
        isAddingGarden={isAddingGarden}
        setIsAddingGarden={setIsAddingGarden}
        startEditGarden={startEditGarden}
        deleteGarden={deleteGarden}
        handleLogout={handleLogout}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isInstructionsOpen={isInstructionsOpen}
        setIsInstructionsOpen={setIsInstructionsOpen}
      />

      {/* Add Garden Dialog */}
      <AddGardenDialog
        open={isAddingGarden}
        onOpenChange={setIsAddingGarden}
        newGardenName={newGardenName}
        setNewGardenName={setNewGardenName}
        addGarden={addGarden}
      />

      {/* Edit Garden Dialog */}
      <EditGardenDialog
        editingGarden={editingGarden}
        setEditingGarden={setEditingGarden}
        saveGardenEdit={saveGardenEdit}
      />

      {/* No Gardens State */}
      {gardens.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl bg-muted/20">
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Home size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Gardens Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first garden to start planning your rows and plants.
            </p>
            <Button onClick={() => setIsAddingGarden(true)} className="bg-primary hover:bg-primary/90" size="lg">
              <Plus size={18} className="mr-2" />
              Create Your First Garden
            </Button>
          </div>
        </div>
      ) : (
        <GardenRows
          rows={rows}
          viewMode={viewMode}
          isAddingRow={isAddingRow}
          setIsAddingRow={setIsAddingRow}
          newRowName={newRowName}
          setNewRowName={setNewRowName}
          newRowLength={newRowLength}
          setNewRowLength={setNewRowLength}
          newRowEnds={newRowEnds}
          setNewRowEnds={setNewRowEnds}
          addRow={addRow}
          deleteRow={deleteRow}
          startEditRow={startEditRow}
          addingPlantLoading={addingPlantLoading}
          setAddingPlantToRowId={setAddingPlantToRowId}
          setIsAddPlantDialogOpen={setIsAddPlantDialogOpen}
          calculateUsedSpace={calculateUsedSpace}
          calculateUsedPercentage={calculateUsedPercentage}
          removePlant={removePlant}
          movePlant={movePlant}
          movingPlant={movingPlant}
        />
      )}

      {/* Add Row Dialog */}
      <AddRowDialog
        open={isAddingRow}
        onOpenChange={setIsAddingRow}
        newRowName={newRowName}
        setNewRowName={setNewRowName}
        newRowLength={newRowLength}
        setNewRowLength={setNewRowLength}
        newRowEnds={newRowEnds}
        setNewRowEnds={setNewRowEnds}
        addRow={addRow}
      />

      {/* Edit Row Dialog */}
      <EditRowDialog editingRow={editingRow} setEditingRow={setEditingRow} saveRowEdit={saveRowEdit} />

      {/* Add Plant Dialog */}
      <AddPlantDialog
        open={isAddPlantDialogOpen}
        onOpenChange={setIsAddPlantDialogOpen}
        plants={plants}
        rows={rows}
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        addingPlantToRowId={addingPlantToRowId}
        setAddingPlantToRowId={setAddingPlantToRowId}
        addingPlantLoading={addingPlantLoading}
        usageCounts={usageCounts}
        wouldPlantFit={wouldPlantFit}
        addPlantToRow={addPlantToRow}
      />

      {/* Instructions Modal */}
      <InstructionsPanel open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen} />
    </div>
  )
}
