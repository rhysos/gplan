"use client"

// Import necessary React hooks and utilities
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation" // Next.js router for navigation
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
  Flower,
} from "lucide-react" // Import icons from lucide-react library

// Import UI components from shadcn/ui
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast" // Custom hook for displaying toast notifications
import { CloudinaryImage } from "@/components/cloudinary-image" // Custom component for displaying Cloudinary images
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import server actions for database operations
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

// TypeScript interfaces to define the shape of our data
// This helps with type checking and code completion
interface Plant {
  id: number
  name: string
  spacing: number // Spacing in centimeters
  image_url: string
  quantity?: number // Optional property for available quantity
  used_count?: number // Optional property for tracking usage
}

interface PlantInstance {
  id: number
  plant_id: number
  position: number // Position in centimeters from the start of the row
  name: string
  spacing: number
  image_url: string | null
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null // For animations
}

interface GardenRow {
  id: number
  name: string
  length: number // Length in centimeters
  row_ends: number // Space at the ends of the row in centimeters
  plants?: PlantInstance[] // Optional array of plants in this row
  isActive?: boolean // UI state for highlighting active rows
}

interface Garden {
  id: number
  name: string
}

// Main component that takes a userId prop
export default function GardenPlanner({ userId }: { userId: number }) {
  // Initialize Next.js router for navigation
  const router = useRouter()

  // Initialize toast notifications
  const { toast } = useToast()

  // State for gardens data and UI
  const [gardens, setGardens] = useState<Garden[]>([]) // List of user's gardens
  const [isLoading, setIsLoading] = useState(true) // Loading state for initial data fetch
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null) // Currently selected garden

  // State for rows and plants
  const [rows, setRows] = useState<GardenRow[]>([]) // Rows in the current garden
  const [plants, setPlants] = useState<Plant[]>([]) // Available plants/flowers
  const [usageCounts, setUsageCounts] = useState<Record<number, number>>({}) // Track plant usage by ID

  // UI state for plant operations
  const [addingPlantLoading, setAddingPlantLoading] = useState<number | null>(null) // Track which row is adding a plant
  const [movingPlant, setMovingPlant] = useState<boolean>(false) // Track if a plant is being moved

  // Ref to store animation timeouts for cleanup
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State for garden management UI
  const [isAddingGarden, setIsAddingGarden] = useState(false) // Control add garden dialog
  const [newGardenName, setNewGardenName] = useState("") // New garden name input
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null) // Garden being edited

  // State for row management UI
  const [isAddingRow, setIsAddingRow] = useState(false) // Control add row dialog
  const [newRowName, setNewRowName] = useState("") // New row name input
  const [newRowLength, setNewRowLength] = useState(240) // Default 2.4 meters (240 cm)
  const [newRowEnds, setNewRowEnds] = useState(0) // Default 0 cm for row ends
  const [editingRow, setEditingRow] = useState<GardenRow | null>(null) // Row being edited

  // State for plant management UI
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null) // Currently selected plant ID
  const [addingPlantToRowId, setAddingPlantToRowId] = useState<number | null>(null) // Row ID to add plant to
  const [isAddPlantDialogOpen, setIsAddPlantDialogOpen] = useState(false) // Control add plant dialog

  // Clean up any animation timeouts when component unmounts
  // This prevents memory leaks
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  // Load user's gardens when component mounts
  // The dependency array [userId, toast] means this effect runs when userId or toast changes
  useEffect(() => {
    const loadGardens = async () => {
      try {
        // Fetch gardens from the server
        const userGardens = await getUserGardens(userId)
        setGardens(userGardens)

        // If there are gardens, select the first one
        if (userGardens.length > 0) {
          setCurrentGardenId(userGardens[0].id)
        }
      } catch (error) {
        // Show error toast if fetching fails
        toast({
          title: "Error",
          description: "Failed to load your gardens",
          variant: "destructive",
        })
      } finally {
        // Set loading to false regardless of success or failure
        setIsLoading(false)
      }
    }

    loadGardens()
  }, [userId, toast])

  // Load plants and usage counts
  useEffect(() => {
    const loadPlantsAndCounts = async () => {
      try {
        // Fetch plants and usage counts in parallel for better performance
        const [allPlants, counts] = await Promise.all([getPlants(userId), getFlowerUsageCounts()])

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
  // useCallback memoizes this function to prevent unnecessary re-renders
  const loadRows = useCallback(async () => {
    if (!currentGardenId) return

    try {
      // Fetch rows for the current garden
      const gardenRows = await getGardenRows(currentGardenId)

      // Load plants for each row in parallel
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
  }, [currentGardenId, toast]) // Dependencies for useCallback

  // Call loadRows when currentGardenId changes
  useEffect(() => {
    loadRows()
  }, [currentGardenId, loadRows])

  // Garden Management Functions

  // Add a new garden
  const addGarden = async () => {
    if (newGardenName.trim() === "") return // Validate input

    try {
      // Create garden in the database
      const newGarden = await createUserGarden(userId, newGardenName)

      // Update local state
      setGardens([...gardens, newGarden])
      setCurrentGardenId(newGarden.id)

      // Reset form
      setNewGardenName("")
      setIsAddingGarden(false)

      // Show success toast
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

  // Delete a garden
  const deleteGarden = async (gardenId: number) => {
    // Prevent deleting the last garden
    if (gardens.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one garden",
        variant: "destructive",
      })
      return
    }

    try {
      // Delete from database
      await deleteUserGarden(gardenId, userId)

      // Update local state
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

  // Start editing a garden (open edit dialog)
  const startEditGarden = (garden: Garden) => {
    setEditingGarden({ ...garden }) // Create a copy to avoid mutating the original
  }

  // Save garden edits
  const saveGardenEdit = async () => {
    if (!editingGarden) return

    try {
      // Update in database
      const updatedGarden = await updateUserGarden(editingGarden.id, userId, editingGarden.name)

      // Update local state
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

  // Add a new row
  const addRow = async () => {
    if (newRowName.trim() === "" || !currentGardenId) return // Validate input

    try {
      // Create row in database
      const newRow = await createGardenRow(currentGardenId, newRowName, newRowLength, newRowEnds)

      // Update local state
      setRows([...rows, { ...newRow, plants: [] }])

      // Reset form
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

  // Delete a row
  const deleteRow = async (rowId: number) => {
    try {
      // Delete from database
      await deleteGardenRow(rowId)

      // Update local state
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

  // Start editing a row (open edit dialog)
  const startEditRow = (row: GardenRow) => {
    setEditingRow({ ...row }) // Create a copy to avoid mutating the original
  }

  // Save row edits
  const saveRowEdit = async () => {
    if (!editingRow) return

    try {
      // Update in database
      const updatedRow = await updateGardenRow(editingRow.id, editingRow.name, editingRow.length, editingRow.row_ends)

      // Update local state, preserving the plants array
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

  // Add a plant to a row
  const addPlantToRow = async (rowId: number) => {
    if (!selectedPlant) return // Validate selected plant

    // Find the row and plant
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
      // Set loading state
      setAddingPlantLoading(rowId)

      // Highlight the active row
      setRows(
        rows.map((r) => ({
          ...r,
          isActive: r.id === rowId,
        })),
      )

      // Create an optimistic plant instance for immediate UI update
      const optimisticPlantInstance: PlantInstance = {
        id: -1, // Temporary ID
        plant_id: selectedPlant,
        position: position,
        name: plant.name,
        spacing: plant.spacing,
        image_url: plant.image_url,
        animationState: "entering", // For animation
      }

      // Update the UI immediately with optimistic data
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

      // Close the dialog immediately for better UX
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

  // Remove a plant from a row
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
      })
    } finally {
      setMovingPlant(false)
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login") // Navigate to login page
      router.refresh() // Refresh the page to clear any cached data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  // Calculate used space in a row, including row_ends on both sides and using the larger spacing between plants
  // useCallback memoizes this function to prevent unnecessary recalculations
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

  // Memoize the current garden name to prevent unnecessary recalculations
  const currentGardenName = useMemo(() => {
    return gardens.find((g) => g.id === currentGardenId)?.name || "Select Garden"
  }, [gardens, currentGardenId])

  // Show loading spinner while data is being fetched
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

  // Main component render
  return (
    <div className="container mx-auto py-4 px-2 md:px-4">
      {/* Header with Garden Selector */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Garden Planner</h1>

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
                {currentGardenId && gardens.length > 1 && (
                  <DropdownMenuItem onClick={() => deleteGarden(currentGardenId)} className="text-destructive">
                    <Trash2 size={16} className="mr-2" />
                    Delete {currentGardenName}
                  </DropdownMenuItem>
                )}
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

          {/* Logout button */}
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

      {/* Edit Garden Dialog - Only shown when editingGarden is not null */}
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

      {/* No Gardens State - Show when user has no gardens */}
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
          {/* Add Row Button - Only shown when user has at least one garden */}
          <div className="mb-4">
            <Dialog open={isAddingRow} onOpenChange={setIsAddingRow}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "var(--light-blue)", color: "var(--ebony)" }}
                  size="sm"
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

          {/* Garden Rows - Display all rows in the current garden */}
          <div className="space-y-4">
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
              <div className="space-y-4 w-full">
                {rows.map((row) => {
                  // Calculate space usage for this row
                  const usedSpace = calculateUsedSpace(row)
                  const usedPercentage = calculateUsedPercentage(row)

                  return (
                    <div
                      key={row.id}
                      className={`border rounded-lg p-3 transition-all duration-300 ${
                        row.isActive ? "row-highlight" : ""
                      }`}
                      style={{ borderColor: row.isActive ? "var(--sunglow)" : "var(--cadet-gray)" }}
                    >
                      {/* Row Header - Contains row name and action buttons */}
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">{row.name}</h2>
                          <div className="flex gap-1">
                            {/* Add Flower Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setAddingPlantToRowId(row.id)
                                      setIsAddPlantDialogOpen(true)
                                    }}
                                    disabled={addingPlantLoading === row.id}
                                  >
                                    {addingPlantLoading === row.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                    ) : (
                                      <Flower size={16} />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add Flower</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Edit Row Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Row</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Delete Row Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => deleteRow(row.id)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Row</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        {/* Detailed Row Information - Shows length, row ends, plant count, and used space */}
                        <div
                          className="grid grid-cols-4 gap-1 text-xs p-1 rounded-md"
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
                            <span className="font-medium">Used:</span> {usedSpace} cm
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar - Shows percentage of row space used */}
                      <div className="mb-2">
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

                      {/* Row Visualization - Visual representation of the row with plants */}
                      <div
                        className="relative h-36 rounded-lg overflow-x-auto"
                        style={{ backgroundColor: "rgba(185, 216, 194, 0.1)" }}
                      >
                        <div
                          className="absolute top-0 left-0 h-full flex items-center"
                          style={{ width: `${row.length * 3}px`, minWidth: "100%" }}
                        >
                          {/* Ruler markings - Show meter markers */}
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

                          {/* Row ends visualization - Show space at the ends of the row */}
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

                          {/* Plants - Display each plant in the row */}
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
                                    {/* Full height image */}
                                    <div className="relative w-full h-full flex items-center justify-center">
                                      <CloudinaryImage
                                        src={plantInstance.image_url || "/placeholder.svg?height=80&width=80"}
                                        alt={plantInstance.name || "Flower"}
                                        width={100}
                                        height={100}
                                        objectFit="cover"
                                        className="w-full h-full object-cover object-center"
                                      />

                                      {/* Name overlay - Shows plant name at the bottom of the image */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-1 text-center">
                                        <p className="text-xs truncate text-white">
                                          {plantInstance.name || "Unknown Flower"}
                                        </p>
                                      </div>

                                      {/* Hover actions overlay - Shows buttons when hovering over a plant */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        {/* Move left button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={`h-6 w-6 rounded-full bg-white/80 ${isFirst ? "opacity-50 cursor-not-allowed" : ""}`}
                                          onClick={() => !isFirst && !movingPlant && movePlant(row.id, index, "left")}
                                          disabled={isFirst || movingPlant}
                                          style={{ color: "var(--ebony)" }}
                                        >
                                          <ChevronLeft className="h-3 w-3" />
                                        </Button>

                                        {/* Delete button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-full bg-white/80 text-red-600 hover:bg-red-100"
                                          onClick={() => removePlant(row.id, plantInstance.id, plantInstance.plant_id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>

                                        {/* Move right button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={`h-6 w-6 rounded-full bg-white/80 ${isLast ? "opacity-50 cursor-not-allowed" : ""}`}
                                          onClick={() => !isLast && !movingPlant && movePlant(row.id, index, "right")}
                                          disabled={isLast || movingPlant}
                                          style={{ color: "var(--ebony)" }}
                                        >
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Plant Dialog - For selecting and adding plants to a row */}
      <Dialog
        open={isAddPlantDialogOpen}
        onOpenChange={(open) => {
          setIsAddPlantDialogOpen(open)
          if (!open) {
            setAddingPlantToRowId(null)
            setSelectedPlant(null) // Reset selected plant when closing
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Flower to {rows.find((r) => r.id === addingPlantToRowId)?.name || "Row"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-1">
              <Label htmlFor="plant-select">Select a flower:</Label>
              <div className="mt-1 max-h-[300px] overflow-y-auto border rounded-md">
                {plants.map((plant) => {
                  // Calculate availability
                  const quantity = plant.quantity || 10
                  const usedCount = usageCounts[plant.id] || 0
                  const available = quantity - usedCount

                  // Check if plant would fit in the row
                  const canFit = addingPlantToRowId
                    ? wouldPlantFit(rows.find((r) => r.id === addingPlantToRowId)!, plant)
                    : true

                  const isDisabled = available <= 0 || !canFit
                  const isSelected = selectedPlant === plant.id

                  return (
                    <div
                      key={plant.id}
                      onClick={() => {
                        if (!isDisabled && !addingPlantLoading) {
                          setSelectedPlant(plant.id)
                        }
                      }}
                      className={`flex items-center gap-2 p-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/20"
                      } ${isSelected ? "bg-primary/20" : ""}`}
                    >
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <CloudinaryImage
                          src={plant.image_url}
                          alt={plant.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{plant.name}</span>
                          <Badge variant={available > 0 ? "outline" : "destructive"} className="ml-2">
                            {available} left
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Spacing: {plant.spacing} cm</div>
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

            {/* Add Flower Button */}
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  if (selectedPlant && addingPlantToRowId && !addingPlantLoading) {
                    addPlantToRow(addingPlantToRowId)
                  }
                }}
                disabled={!selectedPlant || addingPlantLoading}
                className="flex items-center gap-2"
              >
                {addingPlantLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Flower className="h-4 w-4" />
                    Add Flower
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog - Only shown when editingRow is not null */}
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
