"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { useGardens, type Garden } from "@/hooks/useGardens"
import { usePlants, type Plant } from "@/hooks/usePlants"
import { useRows, type GardenRow } from "@/hooks/useRows"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { logoutUser } from "@/lib/actions"

// Define the context type
export interface GardenContextType {
  // Gardens state and functions
  gardens: Garden[]
  currentGardenId: number | null
  setCurrentGardenId: (id: number) => void
  currentGardenName: string
  isAddingGarden: boolean
  setIsAddingGarden: (value: boolean) => void
  newGardenName: string
  setNewGardenName: (name: string) => void
  editingGarden: Garden | null
  setEditingGarden: (garden: Garden | null) => void
  addGarden: () => Promise<void>
  deleteGarden: (gardenId: number) => Promise<void>
  startEditGarden: (garden: Garden) => void
  saveGardenEdit: () => Promise<void>
  gardensLoading: boolean

  // Plants state and functions
  plants: Plant[]
  usageCounts: Record<number, number>
  plantsLoading: boolean
  updatePlantUsage: (plantId: number, increment: boolean) => void
  getAvailablePlants: () => Plant[]

  // Rows state and functions
  rows: GardenRow[]
  rowsLoading: boolean
  isAddingRow: boolean
  setIsAddingRow: (value: boolean) => void
  newRowName: string
  setNewRowName: (name: string) => void
  newRowLength: number
  setNewRowLength: (length: number) => void
  newRowEnds: number
  setNewRowEnds: (ends: number) => void
  editingRow: GardenRow | null
  setEditingRow: (row: GardenRow | null) => void
  addingPlantLoading: number | null
  movingPlant: boolean
  selectedPlant: number | null
  setSelectedPlant: (id: number | null) => void
  addingPlantToRowId: number | null
  setAddingPlantToRowId: (id: number | null) => void
  isAddPlantDialogOpen: boolean
  setIsAddPlantDialogOpen: (value: boolean) => void
  loadRows: () => Promise<void>
  addRow: () => Promise<void>
  deleteRow: (rowId: number) => Promise<void>
  startEditRow: (row: GardenRow) => void
  saveRowEdit: () => Promise<void>
  calculateUsedSpace: (row: GardenRow, newPlant?: Plant) => number
  calculateUsedPercentage: (row: GardenRow) => number
  wouldPlantFit: (row: GardenRow, plant: Plant) => boolean
  addPlantToRow: (rowId: number, plant: Plant) => Promise<void>
  removePlant: (rowId: number, plantInstanceId: number, plantId: number) => Promise<void>
  movePlant: (rowId: number, plantIndex: number, direction: "left" | "right") => Promise<void>

  // UI state
  viewMode: "list" | "grid"
  setViewMode: (mode: "list" | "grid") => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (value: boolean) => void
  isInstructionsOpen: boolean
  setIsInstructionsOpen: (value: boolean) => void

  // Auth functions
  handleLogout: () => Promise<void>
}

// Create the context
export const GardenContext = createContext<GardenContextType | null>(null)

// Provider props
interface GardenProviderProps {
  children: ReactNode
  userId: number
}

// Create the provider component
export const GardenProvider: React.FC<GardenProviderProps> = ({ children, userId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isInstructionsOpen, setIsInstructionsOpen] = React.useState(false)

  // Use the existing hooks
  const {
    gardens,
    currentGardenId,
    setCurrentGardenId,
    currentGardenName,
    isLoading: gardensLoading,
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
  } = useGardens(userId)

  const { plants, usageCounts, isLoading: plantsLoading, updatePlantUsage, getAvailablePlants } = usePlants(userId)

  const {
    rows,
    isLoading: rowsLoading,
    isAddingRow,
    setIsAddingRow,
    newRowName,
    setNewRowName,
    newRowLength,
    setNewRowLength,
    newRowEnds,
    setNewRowEnds,
    editingRow,
    setEditingRow,
    addingPlantLoading,
    movingPlant,
    selectedPlant,
    setSelectedPlant,
    addingPlantToRowId,
    setAddingPlantToRowId,
    isAddPlantDialogOpen,
    setIsAddPlantDialogOpen,
    loadRows,
    addRow,
    deleteRow,
    startEditRow,
    saveRowEdit,
    calculateUsedSpace,
    calculateUsedPercentage,
    wouldPlantFit,
    addPlantToRow,
    removePlant,
    movePlant,
  } = useRows(currentGardenId, updatePlantUsage)

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

  // Combine all values into the context
  const contextValue: GardenContextType = {
    // Gardens
    gardens,
    currentGardenId,
    setCurrentGardenId,
    currentGardenName,
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
    gardensLoading,

    // Plants
    plants,
    usageCounts,
    plantsLoading,
    updatePlantUsage,
    getAvailablePlants,

    // Rows
    rows,
    rowsLoading,
    isAddingRow,
    setIsAddingRow,
    newRowName,
    setNewRowName,
    newRowLength,
    setNewRowLength,
    newRowEnds,
    setNewRowEnds,
    editingRow,
    setEditingRow,
    addingPlantLoading,
    movingPlant,
    selectedPlant,
    setSelectedPlant,
    addingPlantToRowId,
    setAddingPlantToRowId,
    isAddPlantDialogOpen,
    setIsAddPlantDialogOpen,
    loadRows,
    addRow,
    deleteRow,
    startEditRow,
    saveRowEdit,
    calculateUsedSpace,
    calculateUsedPercentage,
    wouldPlantFit,
    addPlantToRow,
    removePlant,
    movePlant,

    // UI state
    viewMode,
    setViewMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isInstructionsOpen,
    setIsInstructionsOpen,

    // Auth
    handleLogout,
  }

  return <GardenContext.Provider value={contextValue}>{children}</GardenContext.Provider>
}

// Custom hook to use the garden context
export const useGardenContext = () => {
  const context = useContext(GardenContext)
  if (!context) {
    throw new Error("useGardenContext must be used within a GardenProvider")
  }
  return context
}
