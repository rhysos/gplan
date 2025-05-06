"use client"

import type React from "react"

// Import necessary React hooks and utilities
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
  Flower,
  LayoutGrid,
  Menu,
  X,
  Info,
  Settings,
  Ruler,
} from "lucide-react"

// Import UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

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
      }, 500)

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

      await new Promise((resolve) => setTimeout(resolve, 300))

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
      }, 500)

      toast({
        title: "Flower removed",
        description: "Flower has been removed successfully",
      })
    } catch (error) {
      loadRows()

      toast({
        title: "Error",
        description: "Failed to remove flower",
        variant: "destructive",
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

      await new Promise((resolve) => setTimeout(resolve, 50))

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

      await new Promise((resolve) => setTimeout(resolve, 300))

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
      }, 200)

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
      {/* Modern Header with Garden Selector */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">
              Garden Planner
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {gardens.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all"
                  >
                    <Home size={16} className="text-primary" />
                    <span className="font-medium">{currentGardenName}</span>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {gardens.map((garden) => (
                    <DropdownMenuItem
                      key={garden.id}
                      onClick={() => setCurrentGardenId(garden.id)}
                      className={garden.id === currentGardenId ? "bg-primary/10 text-primary font-medium" : ""}
                    >
                      {garden.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddingGarden(true)} className="text-primary">
                    <Plus size={16} className="mr-2" />
                    Add New Garden
                  </DropdownMenuItem>
                  {currentGardenId && gardens.length > 1 && (
                    <DropdownMenuItem onClick={() => deleteGarden(currentGardenId)} className="text-destructive">
                      <Trash2 size={16} className="mr-2" />
                      Delete {currentGardenName}
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

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")}>
              <TabsList className="bg-muted/30">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Menu size={16} />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>List View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="grid" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <LayoutGrid size={16} />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Grid View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>
            </Tabs>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut size={18} />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <div className="space-y-3">
              {gardens.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Current Garden</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{currentGardenName}</span>
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
                      {gardens.map((garden) => (
                        <DropdownMenuItem
                          key={garden.id}
                          onClick={() => setCurrentGardenId(garden.id)}
                          className={garden.id === currentGardenId ? "bg-primary/10 text-primary font-medium" : ""}
                        >
                          {garden.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsAddingGarden(true)} className="text-primary">
                        <Plus size={16} className="mr-2" />
                        Add New Garden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary text-white" : ""}
                >
                  <Menu size={16} className="mr-2" />
                  List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary text-white" : ""}
                >
                  <LayoutGrid size={16} className="mr-2" />
                  Grid
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Add Garden Dialog */}
      <Dialog open={isAddingGarden} onOpenChange={setIsAddingGarden}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Garden</DialogTitle>
            <DialogDescription>Give your garden a name to help you organize your planting plans.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="garden-name">Garden Name</Label>
              <Input
                id="garden-name"
                value={newGardenName}
                onChange={(e) => setNewGardenName(e.target.value)}
                placeholder="e.g., Backyard Garden"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingGarden(false)}>
              Cancel
            </Button>
            <Button onClick={addGarden} className="bg-primary hover:bg-primary/90">
              Create Garden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Garden Dialog */}
      {editingGarden && (
        <Dialog open={!!editingGarden} onOpenChange={(open) => !open && setEditingGarden(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Garden</DialogTitle>
              <DialogDescription>Update the name of your garden.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-garden-name">Garden Name</Label>
                <Input
                  id="edit-garden-name"
                  value={editingGarden.name}
                  onChange={(e) => setEditingGarden({ ...editingGarden, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGarden(null)}>
                Cancel
              </Button>
              <Button onClick={saveGardenEdit} className="bg-primary hover:bg-primary/90">
                <Save size={16} className="mr-2" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
        <>
          {/* Garden Controls */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{currentGardenName}</h2>
              <p className="text-muted-foreground">{rows.length} rows in this garden</p>
            </div>

            <Dialog open={isAddingRow} onOpenChange={setIsAddingRow}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Add Garden Row
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Garden Row</DialogTitle>
                  <DialogDescription>Create a new row in your garden for planting.</DialogDescription>
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
                    <div className="flex justify-between">
                      <Label htmlFor="row-length">Row Length</Label>
                      <span className="text-sm text-muted-foreground">
                        {newRowLength} cm ({(newRowLength / 100).toFixed(1)} m)
                      </span>
                    </div>
                    <Slider
                      id="row-length"
                      value={[newRowLength]}
                      onValueChange={(value) => setNewRowLength(value[0])}
                      min={30}
                      max={2000}
                      step={10}
                      className="flex-1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="row-ends">Row Ends</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Space from the edge to the first/last plant in the row</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="row-ends"
                      type="number"
                      min="0"
                      value={newRowEnds}
                      onChange={(e) => setNewRowEnds(Number(e.target.value))}
                      onClick={(e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select()}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingRow(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addRow} className="bg-primary hover:bg-primary/90">
                    Add Row
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Garden Rows */}
          <div className="space-y-6">
            {rows.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
                <div className="max-w-md mx-auto">
                  <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Ruler size={28} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No Rows Yet</h2>
                  <p className="text-muted-foreground mb-6">Add your first row to start planning your garden layout.</p>
                  <Button onClick={() => setIsAddingRow(true)} className="bg-primary hover:bg-primary/90">
                    <Plus size={16} className="mr-2" />
                    Add Your First Row
                  </Button>
                </div>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-6">
                {rows.map((row) => {
                  const usedSpace = calculateUsedSpace(row)
                  const usedPercentage = calculateUsedPercentage(row)
                  const isNearlyFull = usedPercentage > 90

                  return (
                    <div key={row.id} className={`garden-row p-5 ${row.isActive ? "ring-2 ring-primary" : ""}`}>
                      {/* Row Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{row.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Ruler size={14} />
                              <span>{row.length} cm</span>
                            </div>
                            <div>•</div>
                            <div>
                              <span>{(row.plants || []).length} plants</span>
                            </div>
                            <div>•</div>
                            <div>
                              <span>{usedSpace} cm used</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-3"
                                  onClick={() => {
                                    setAddingPlantToRowId(row.id)
                                    setIsAddPlantDialogOpen(true)
                                  }}
                                  disabled={addingPlantLoading === row.id}
                                >
                                  {addingPlantLoading === row.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                  ) : (
                                    <>
                                      <Flower size={14} className="mr-1" />
                                      <span>Add Plant</span>
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add a flower to this row</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Settings size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditRow(row)}>
                                <Edit size={14} className="mr-2" />
                                Edit Row
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-destructive">
                                <Trash2 size={14} className="mr-2" />
                                Delete Row
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Space Usage</span>
                          <Badge variant={isNearlyFull ? "destructive" : "outline"} className="text-xs">
                            {usedPercentage}%
                          </Badge>
                        </div>
                        <Progress
                          value={usedPercentage}
                          className="h-2"
                          indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
                        />
                      </div>

                      {/* Row Visualization */}
                      <div className="relative h-36 rounded-lg overflow-x-auto custom-scrollbar bg-muted/20">
                        <div
                          className="absolute top-0 left-0 h-full flex items-center"
                          style={{ width: `${row.length * 3}px`, minWidth: "100%" }}
                        >
                          {/* Ruler markings */}
                          {Array.from({ length: Math.ceil(row.length / 100) + 1 }).map((_, i) => (
                            <div key={i} className="absolute h-full" style={{ left: `${i * 300}px` }}>
                              <div className="absolute bottom-0 h-4 border-l border-muted-foreground/30"></div>
                              <div className="absolute bottom-0 text-xs text-muted-foreground" style={{ left: "4px" }}>
                                {i}m
                              </div>
                            </div>
                          ))}

                          {/* Row ends visualization */}
                          {row.row_ends > 0 && (
                            <>
                              {/* Left end */}
                              <div
                                className="absolute top-2 bottom-6 border border-dashed rounded-md"
                                style={{
                                  left: 0,
                                  width: `${row.row_ends * 3}px`,
                                  backgroundColor: "rgba(138, 161, 177, 0.1)",
                                  borderColor: "rgba(138, 161, 177, 0.3)",
                                }}
                              >
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-xs rotate-90 text-muted-foreground">Row end</span>
                                </div>
                              </div>

                              {/* Right end */}
                              <div
                                className="absolute top-2 bottom-6 border border-dashed rounded-md"
                                style={{
                                  right: 0,
                                  width: `${row.row_ends * 3}px`,
                                  backgroundColor: "rgba(138, 161, 177, 0.1)",
                                  borderColor: "rgba(138, 161, 177, 0.3)",
                                }}
                              >
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-xs rotate-90 text-muted-foreground">Row end</span>
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

                              // Determine animation class
                              let animationClass = ""
                              if (plantInstance.animationState === "entering") animationClass = "plant-enter"
                              if (plantInstance.animationState === "exiting") animationClass = "plant-exit"
                              if (plantInstance.animationState === "moving-left") animationClass = "plant-move-left"
                              if (plantInstance.animationState === "moving-right") animationClass = "plant-move-right"

                              return (
                                <div
                                  key={plantInstance.id}
                                  className="plant-container absolute top-2 bottom-6 group"
                                  style={{
                                    left: `${plantInstance.position * 3}px`,
                                    width: `${(plantInstance.spacing || 0) * 3}px`,
                                  }}
                                >
                                  <div
                                    className={`plant-card h-full flex flex-col relative bg-white dark:bg-gray-800 shadow-sm ${animationClass}`}
                                  >
                                    {/* Plant image */}
                                    <div className="relative w-full h-full flex items-center justify-center">
                                      <CloudinaryImage
                                        src={plantInstance.image_url || "/placeholder.svg?height=80&width=80"}
                                        alt={plantInstance.name || "Flower"}
                                        width={100}
                                        height={100}
                                        objectFit="cover"
                                        className="w-full h-full object-cover object-center"
                                      />

                                      {/* Name overlay */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 text-center">
                                        <p className="text-xs font-medium truncate text-white">
                                          {plantInstance.name || "Unknown Flower"}
                                        </p>
                                      </div>

                                      {/* Hover actions overlay */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        {/* Move left button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={`h-7 w-7 rounded-full bg-white/90 ${isFirst ? "opacity-50 cursor-not-allowed" : ""}`}
                                          onClick={() => !isFirst && !movingPlant && movePlant(row.id, index, "left")}
                                          disabled={isFirst || movingPlant}
                                        >
                                          <ChevronLeft className="h-4 w-4 text-gray-800" />
                                        </Button>

                                        {/* Delete button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-full bg-white/90 text-red-600 hover:bg-red-100"
                                          onClick={() => removePlant(row.id, plantInstance.id, plantInstance.plant_id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>

                                        {/* Move right button */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={`h-7 w-7 rounded-full bg-white/90 ${isLast ? "opacity-50 cursor-not-allowed" : ""}`}
                                          onClick={() => !isLast && !movingPlant && movePlant(row.id, index, "right")}
                                          disabled={isLast || movingPlant}
                                        >
                                          <ChevronRight className="h-4 w-4 text-gray-800" />
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
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rows.map((row) => {
                  const usedSpace = calculateUsedSpace(row)
                  const usedPercentage = calculateUsedPercentage(row)
                  const isNearlyFull = usedPercentage > 90
                  const plantCount = (row.plants || []).length

                  return (
                    <div
                      key={row.id}
                      className={`garden-row p-5 hover-card ${row.isActive ? "ring-2 ring-primary" : ""}`}
                    >
                      {/* Row Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{row.name}</h3>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setAddingPlantToRowId(row.id)
                                    setIsAddPlantDialogOpen(true)
                                  }}
                                >
                                  <Flower size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add a flower to this row</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditRow(row)}>
                                <Edit size={14} className="mr-2" />
                                Edit Row
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-destructive">
                                <Trash2 size={14} className="mr-2" />
                                Delete Row
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Row Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-muted/30 rounded-md p-2 text-center">
                          <p className="text-xs text-muted-foreground">Length</p>
                          <p className="font-medium">{row.length} cm</p>
                        </div>
                        <div className="bg-muted/30 rounded-md p-2 text-center">
                          <p className="text-xs text-muted-foreground">Plants</p>
                          <p className="font-medium">{plantCount}</p>
                        </div>
                        <div className="bg-muted/30 rounded-md p-2 text-center">
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="font-medium">{usedPercentage}%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <Progress
                        value={usedPercentage}
                        className="h-2 mb-3"
                        indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
                      />

                      {/* Plant Preview */}
                      <div className="flex items-center justify-center gap-1 h-16 bg-muted/20 rounded-md overflow-hidden">
                        {plantCount > 0 ? (
                          <div className="flex items-center">
                            {(row.plants || [])
                              .filter((p) => p && p.image_url)
                              .slice(0, 5)
                              .map((plant, i) => (
                                <div key={plant.id} className="relative -ml-2 first:ml-0" style={{ zIndex: 5 - i }}>
                                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                                    <CloudinaryImage
                                      src={plant.image_url || "/placeholder.svg?height=40&width=40"}
                                      alt={plant.name}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ))}
                            {plantCount > 5 && (
                              <Badge variant="secondary" className="ml-1">
                                +{plantCount - 5} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No plants added yet</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Plant Dialog */}
      <Dialog
        open={isAddPlantDialogOpen}
        onOpenChange={(open) => {
          setIsAddPlantDialogOpen(open)
          if (!open) {
            setAddingPlantToRowId(null)
            setSelectedPlant(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Flower to Row</DialogTitle>
            <DialogDescription>
              Select a flower to add to {rows.find((r) => r.id === addingPlantToRowId)?.name || "this row"}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="plant-select" className="mb-2 block">
              Select a flower:
            </Label>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-1">
                {plants.map((plant) => {
                  // Calculate availability
                  const quantity = plant.quantity || 0
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
                      className={`flex items-center gap-3 p-3 my-1 rounded-md cursor-pointer transition-colors ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
                      } ${isSelected ? "bg-primary/10 border border-primary/30" : "border border-transparent"}`}
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                        <CloudinaryImage
                          src={plant.image_url}
                          alt={plant.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
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
                        <div className="text-amber-500 flex items-center text-xs whitespace-nowrap">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Won't fit
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPlantDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPlant && addingPlantToRowId && !addingPlantLoading) {
                  addPlantToRow(addingPlantToRowId)
                }
              }}
              disabled={!selectedPlant || addingPlantLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {addingPlantLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Flower className="h-4 w-4 mr-2" />
                  Add Flower
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      {editingRow && (
        <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Row</DialogTitle>
              <DialogDescription>Update the details of your garden row.</DialogDescription>
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
                <div className="flex justify-between">
                  <Label htmlFor="edit-row-length">Row Length</Label>
                  <span className="text-sm text-muted-foreground">
                    {editingRow.length} cm ({(editingRow.length / 100).toFixed(1)} m)
                  </span>
                </div>
                <Slider
                  id="edit-row-length"
                  value={[editingRow.length]}
                  onValueChange={(value) => setEditingRow({ ...editingRow, length: value[0] })}
                  min={30}
                  max={2000}
                  step={10}
                  className="flex-1"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="edit-row-ends">Row Ends</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Space from the edge to the first/last plant in the row</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="edit-row-ends"
                  type="number"
                  min="0"
                  value={editingRow.row_ends || 0}
                  onChange={(e) => setEditingRow({ ...editingRow, row_ends: Number(e.target.value) })}
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRow(null)}>
                Cancel
              </Button>
              <Button onClick={saveRowEdit} className="bg-primary hover:bg-primary/90">
                <Save size={16} className="mr-2" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
