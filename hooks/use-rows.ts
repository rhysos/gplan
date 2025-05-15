"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getGardenRows,
  createGardenRow,
  updateGardenRow,
  deleteGardenRow,
  getRowPlants,
  addPlantToRow as serverAddPlantToRow,
  removePlantFromRow,
} from "@/lib/actions"
import type { Plant } from "./use-plants"

export interface PlantInstance {
  id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string | null
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null
}

export interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: PlantInstance[]
  isActive?: boolean
}

export function useRows(gardenId: number | null, updatePlantUsage: (plantId: number, increment: boolean) => void) {
  const { toast } = useToast()
  const [rows, setRows] = useState<GardenRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [newRowName, setNewRowName] = useState("")
  const [newRowLength, setNewRowLength] = useState(240)
  const [newRowEnds, setNewRowEnds] = useState(0)
  const [editingRow, setEditingRow] = useState<GardenRow | null>(null)
  const [addingPlantLoading, setAddingPlantLoading] = useState<number | null>(null)
  const [movingPlant, setMovingPlant] = useState<boolean>(false)
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)
  const [addingPlantToRowId, setAddingPlantToRowId] = useState<number | null>(null)
  const [isAddPlantDialogOpen, setIsAddPlantDialogOpen] = useState(false)

  // Ref to store animation timeouts for cleanup
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add this at the top of the hook, outside any function
  const calculationDepthRef = useRef<Record<string, number>>({})
  const usedSpaceCache = useRef<Record<string, number>>({})
  const usedPercentageCache = useRef<Record<string, number>>({})

  // Clean up any animation timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  // Add this utility function at the top of the hook
  const safeFetch = async (fetchFn: () => Promise<any>, errorMessage: string) => {
    try {
      console.log(`Starting fetch operation: ${errorMessage}`)
      const result = await fetchFn()
      console.log(`Fetch operation completed successfully`)
      return result
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`)
        console.error(`Error stack: ${error.stack}`)
      }

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        console.error("Network error detected. This could be due to connectivity issues or CORS.")
      }

      throw error
    }
  }

  // Then update the loadRows function to use this utility
  const loadRows = useCallback(async () => {
    if (!gardenId) return

    try {
      setIsLoading(true)
      console.log(`Loading rows for garden ${gardenId}`)

      const gardenRows = await safeFetch(() => getGardenRows(gardenId), `Error fetching rows for garden ${gardenId}`)
      console.log(`Fetched ${gardenRows.length} rows for garden ${gardenId}`)

      const rowsWithPlants = await Promise.all(
        gardenRows.map(async (row) => {
          try {
            console.log(`Fetching plants for row ${row.id} (${row.name})`)
            const plants = await safeFetch(() => getRowPlants(row.id), `Error fetching plants for row ${row.id}`)
            console.log(`Fetched ${plants.length} plants for row ${row.id}`)

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

      console.log(`Finished loading all rows with plants`)
      setRows(rowsWithPlants)

      // Clear caches when loading new data
      clearUsedSpaceCache()
    } catch (error) {
      console.error(`Error in loadRows:`, error)
      toast({
        title: "Error",
        description: "Failed to load garden rows. See console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [gardenId, toast])

  // Add this function to clear the cache
  const clearUsedSpaceCache = useCallback(() => {
    usedSpaceCache.current = {}
    usedPercentageCache.current = {}
  }, [])

  // Call loadRows when gardenId changes
  useEffect(() => {
    if (gardenId) {
      loadRows()
    } else {
      setRows([])
      clearUsedSpaceCache()
    }
  }, [gardenId, loadRows, clearUsedSpaceCache])

  // Row Management Functions
  const addRow = async () => {
    if (newRowName.trim() === "" || !gardenId) return

    try {
      const newRow = await createGardenRow(gardenId, newRowName, newRowLength, newRowEnds)

      setRows([...rows, { ...newRow, plants: [] }])
      clearUsedSpaceCache()

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
      clearUsedSpaceCache()

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
      clearUsedSpaceCache()
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

  // Calculate the position for a new plant based on the max spacing rule
  const calculateNextPosition = useCallback((row: GardenRow, newPlant: Plant): number => {
    try {
      console.log(`Calculating next position for plant ${newPlant.name} in row ${row.id} (${row.name})`)

      if (!row.plants || row.plants.length === 0) {
        // If there are no plants, position is just after the row end
        const position = row.row_ends || 0
        console.log(`No existing plants, position after row end: ${position}mm`)
        return position
      }

      // Sort plants by position
      const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      console.log(
        `Last plant in row: ${lastPlant.name} at position ${lastPlant.position}mm with spacing ${lastPlant.spacing}mm`,
      )

      // The spacing between plants is the maximum of the two plants' spacing requirements
      const spacingBetween = Math.max(lastPlant.spacing, newPlant.spacing)
      console.log(
        `Max spacing between plants: ${spacingBetween}mm (max of ${lastPlant.spacing}mm and ${newPlant.spacing}mm)`,
      )

      // The next position is the last plant's position plus the spacing between
      const nextPosition = lastPlant.position + spacingBetween
      console.log(`Calculated next position: ${nextPosition}mm`)

      return nextPosition
    } catch (error) {
      console.error(`Error calculating next position:`, error)
      // Fallback to a safe position - row ends or 0
      const fallbackPosition = row?.row_ends || 0
      console.log(`Using fallback position: ${fallbackPosition}mm`)
      return fallbackPosition
    }
  }, [])

  // Calculate used space in a row
  const calculateUsedSpace = useCallback(
    (row: GardenRow, newPlant?: Plant): number => {
      // If we're not checking a new plant and we have a cached value, use it
      const cacheKey = `row-${row.id}-${row.plants?.length || 0}`
      if (!newPlant && usedSpaceCache.current[cacheKey] !== undefined) {
        return usedSpaceCache.current[cacheKey]
      }

      // Add a guard to prevent infinite loops
      const calculationId = `row-${row.id}`
      calculationDepthRef.current[calculationId] = (calculationDepthRef.current[calculationId] || 0) + 1

      if (calculationDepthRef.current[calculationId] > 5) {
        console.warn(`Calculation depth exceeded for ${calculationId}, returning safe value`)
        calculationDepthRef.current[calculationId] = 0
        return row.length // Return a safe value
      }
      try {
        console.log(`Calculating used space for row ${row.id} (${row.name})`, {
          rowLength: row.length,
          rowEnds: row.row_ends,
          plantsCount: row.plants?.length || 0,
          newPlant: newPlant ? { id: newPlant.id, name: newPlant.name, spacing: newPlant.spacing } : "none",
        })

        // Add a guard to prevent infinite loops
        const calculationId = `${row.id}-${Date.now()}`
        console.log(`Starting calculation ${calculationId}`)

        // Row ends (left and right)
        let totalSpace = 2 * (row.row_ends || 0)
        console.log(`Initial space from row ends: ${totalSpace}mm`)

        // IMPORTANT: Explicit check for empty plants array
        if (!row.plants || !Array.isArray(row.plants) || row.plants.length === 0) {
          // If there are no plants and we're not checking a new plant, just return row ends
          if (!newPlant) {
            console.log(`No plants in row, total space: ${totalSpace}mm`)
            usedSpaceCache.current[cacheKey] = totalSpace
            return totalSpace
          }

          // If we're checking a new plant, add its spacing
          const spaceWithNewPlant = totalSpace + newPlant.spacing
          console.log(
            `No plants in row, adding new plant spacing (${newPlant.spacing}mm), total space: ${spaceWithNewPlant}mm`,
          )
          return spaceWithNewPlant
        }

        const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)
        console.log(
          `Sorted plants by position:`,
          sortedPlants.map((p) => ({ id: p.id, name: p.name, position: p.position, spacing: p.spacing })),
        )

        // If we're checking if a new plant would fit
        if (newPlant) {
          try {
            // Calculate the position for the new plant
            const position = calculateNextPosition(row, newPlant)
            console.log(`Calculated position for new plant: ${position}mm`)

            // Add the new plant to the sorted list
            sortedPlants.push({
              id: -1,
              plant_id: -1,
              position,
              name: newPlant.name,
              spacing: newPlant.spacing,
              image_url: newPlant.image_url,
            })

            // Re-sort the list with the new plant
            sortedPlants.sort((a, b) => a.position - b.position)
            console.log(
              `Re-sorted plants with new plant:`,
              sortedPlants.map((p) => ({ id: p.id, name: p.name, position: p.position, spacing: p.spacing })),
            )
          } catch (positionError) {
            console.error(`Error calculating position for new plant:`, positionError)
            // Fallback: add plant at the end with a default position
            const lastPlant = sortedPlants[sortedPlants.length - 1]
            const fallbackPosition = lastPlant
              ? lastPlant.position + Math.max(lastPlant.spacing, newPlant.spacing)
              : row.row_ends || 0
            console.log(`Using fallback position for new plant: ${fallbackPosition}mm`)

            sortedPlants.push({
              id: -1,
              plant_id: -1,
              position: fallbackPosition,
              name: newPlant.name,
              spacing: newPlant.spacing,
              image_url: newPlant.image_url,
            })

            sortedPlants.sort((a, b) => a.position - b.position)
          }
        }

        // If there's only one plant, just add its spacing
        if (sortedPlants.length === 1) {
          // We've already added row_ends to totalSpace, so no need to add anything more
          console.log(`Only one plant, space used is just the row ends: ${totalSpace}mm`)
        } else if (sortedPlants.length > 1) {
          // For multiple plants, calculate the total space they occupy
          const firstPlant = sortedPlants[0]
          const lastPlant = sortedPlants[sortedPlants.length - 1]

          // The total space is: last plant position - first plant position + row ends
          // Since we've already added row ends, we just need the plant space
          // IMPORTANT: We do NOT add the last plant's spacing as row ends accounts for it
          const plantsSpace = lastPlant.position - firstPlant.position
          totalSpace += plantsSpace
          console.log(
            `Multiple plants, first plant position: ${firstPlant.position}mm, last plant position: ${lastPlant.position}mm`,
          )
          console.log(`Plants space: ${plantsSpace}mm, total space: ${totalSpace}mm`)
        }

        console.log(`Final calculated space for row ${row.id}: ${totalSpace}mm (calculation ${calculationId} complete)`)
        // Reset calculation depth
        calculationDepthRef.current[calculationId] = 0
        // Cache the result if we're not checking a new plant
        if (!newPlant) {
          usedSpaceCache.current[cacheKey] = totalSpace
        }
        return totalSpace
      } catch (error) {
        console.error(`Error calculating used space for row ${row?.id || "unknown"}:`, error)
        // Return a safe fallback value
        return row?.length || 0 // Assume worst case - row is full
      }
    },
    [calculateNextPosition],
  )

  // Calculate the percentage of used space in a row
  const calculateUsedPercentage = useCallback(
    (row: GardenRow): number => {
      // Check if we have a cached value
      const cacheKey = `row-${row.id}-${row.plants?.length || 0}`
      if (usedPercentageCache.current[cacheKey] !== undefined) {
        return usedPercentageCache.current[cacheKey]
      }

      const usedSpace = calculateUsedSpace(row)
      const percentage = Math.min(100, Math.round((usedSpace / row.length) * 100))

      // Cache the result
      usedPercentageCache.current[cacheKey] = percentage

      return percentage
    },
    [calculateUsedSpace],
  )

  // Check if a plant would fit in a row
  const wouldPlantFit = useCallback(
    (row: GardenRow, plant: Plant): boolean => {
      try {
        console.log(`Checking if plant ${plant.name} would fit in row ${row.id} (${row.name})`)
        const usedSpace = calculateUsedSpace(row, plant)
        const wouldFit = usedSpace <= row.length
        console.log(`Used space with plant: ${usedSpace}mm, row length: ${row.length}mm, would fit: ${wouldFit}`)
        return wouldFit
      } catch (error) {
        console.error(`Error checking if plant would fit:`, error)
        // Default to false (won't fit) to be safe
        return false
      }
    },
    [calculateUsedSpace],
  )

  // Plant Management Functions
  const addPlantToRow = async (rowId: number, plant: Plant) => {
    clearUsedSpaceCache()
    if (!plant) return

    // Prevent multiple simultaneous operations on the same row
    if (addingPlantLoading === rowId) {
      console.log(`Already adding a plant to row ${rowId}, ignoring duplicate request`)
      return
    }

    const row = rows.find((r) => r.id === rowId)
    if (!row) {
      console.log(`Row ${rowId} not found, cannot add plant`)
      return
    }

    try {
      console.log(`Starting to add plant ${plant.name} to row ${rowId}`)
      setAddingPlantLoading(rowId)

      // Calculate the position for the new plant - with guard for empty rows
      let position: number
      if (!row.plants || row.plants.length === 0) {
        // For empty rows, position is just the row ends
        position = row.row_ends || 0
        console.log(`Empty row, setting position to row ends: ${position}mm`)
      } else {
        // For rows with plants, calculate next position
        position = calculateNextPosition(row, plant)
      }
      console.log(`Calculated position for new plant: ${position}mm`)

      // Create a temporary copy of the row with the new plant to check space
      const tempRow = {
        ...row,
        plants: [
          ...(row.plants || []),
          {
            id: -999, // Temporary ID
            plant_id: plant.id,
            position,
            name: plant.name,
            spacing: plant.spacing,
            image_url: plant.image_url,
          },
        ],
      }

      // Check if the plant would fit
      const usedSpace = calculateUsedSpace(tempRow)
      console.log(`Used space with new plant: ${usedSpace}mm, row length: ${row.length}mm`)

      if (usedSpace > row.length) {
        console.log(`Not enough space in row ${rowId} for plant ${plant.name}`)
        toast({
          title: "Not enough space",
          description: "There's not enough space in this row for this flower",
          variant: "destructive",
        })
        setAddingPlantLoading(null)
        return
      }

      // Set row as active
      setRows(
        rows.map((r) => ({
          ...r,
          isActive: r.id === rowId,
        })),
      )

      // Create optimistic plant instance
      const optimisticPlantInstance: PlantInstance = {
        id: -1,
        plant_id: plant.id,
        position: position,
        name: plant.name,
        spacing: plant.spacing,
        image_url: plant.image_url,
        animationState: "entering",
      }

      // Update UI with optimistic plant
      setRows((prevRows) =>
        prevRows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [...(r.plants || []), optimisticPlantInstance],
            }
          }
          return r
        }),
      )

      // Update plant usage
      updatePlantUsage(plant.id, true)

      // Close dialog and reset selection
      setIsAddPlantDialogOpen(false)
      setSelectedPlant(null)

      // Call server action to add plant
      console.log(`Calling server action to add plant ${plant.id} to row ${rowId} at position ${position}`)
      const newPlantInstance = await serverAddPlantToRow(rowId, plant.id, position)
      console.log(`Server returned new plant instance:`, newPlantInstance)

      // Update UI with actual plant from server
      setRows((prevRows) =>
        prevRows.map((r) => {
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

      // Reset animation states after delay
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      animationTimeoutRef.current = setTimeout(() => {
        setRows((currentRows) =>
          currentRows.map((r) => ({
            ...r,
            isActive: false,
            plants: r.plants?.map((p) => ({
              ...p,
              animationState: null,
            })),
          })),
        )
        console.log(`Animation states reset`)
      }, 800)

      toast({
        title: "Flower added",
        description: `${plant.name} has been added to the row`,
      })
    } catch (error) {
      console.error(`Error adding plant to row ${rowId}:`, error)

      // Revert UI changes
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

      // Revert plant usage
      updatePlantUsage(plant.id, false)

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
    clearUsedSpaceCache()
    console.log(`Removing plant: rowId=${rowId}, plantInstanceId=${plantInstanceId}, plantId=${plantId}`)

    try {
      // Find the row and plant for logging
      const row = rows.find((r) => r.id === rowId)
      const plant = row?.plants?.find((p) => p.id === plantInstanceId)
      console.log(`Found row: ${row?.name || "unknown"}, plant: ${plant?.name || "unknown"}`)

      // Set animation state
      setRows(
        rows.map((row) => {
          if (row.id === rowId) {
            console.log(`Setting 'exiting' animation state for plant ${plantInstanceId} in row ${rowId}`)
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

      // Wait for animation
      console.log(`Waiting for exit animation to complete...`)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update rows with plant removed
      console.log(`Updating rows with plant ${plantInstanceId} removed`)
      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          try {
            const remainingPlants = (row.plants || [])
              .filter((p) => p.id !== plantInstanceId)
              .sort((a, b) => a.position - b.position)
            console.log(
              `Remaining plants after removal:`,
              remainingPlants.map((p) => ({ id: p.id, name: p.name, position: p.position })),
            )

            // IMPORTANT: Check if there are no remaining plants to avoid infinite loops
            if (remainingPlants.length === 0) {
              console.log(`No plants remaining in row after removal. Returning empty plants array.`)
              return {
                ...row,
                plants: [],
              }
            }

            // Recalculate positions for all plants
            let currentPosition = row.row_ends || 0
            console.log(`Starting position for recalculation: ${currentPosition}mm (row ends)`)

            const updatedPlants = remainingPlants.map((plant, index) => {
              const updatedPlant = {
                ...plant,
                position: currentPosition,
              }
              console.log(`Updated position for plant ${plant.id} (${plant.name}): ${currentPosition}mm`)

              // For the next plant, use the max spacing rule
              if (index < remainingPlants.length - 1) {
                const nextPlant = remainingPlants[index + 1]
                const maxSpacing = Math.max(plant.spacing, nextPlant.spacing)
                currentPosition += maxSpacing
                console.log(
                  `Next position calculation: current=${currentPosition}mm, plant spacing=${plant.spacing}mm, next plant spacing=${nextPlant.spacing}mm, max spacing=${maxSpacing}mm`,
                )
              } else {
                currentPosition += plant.spacing
                console.log(`Last plant, next position would be: ${currentPosition}mm`)
              }

              return updatedPlant
            })

            console.log(`All plants repositioned after removal`)
            return {
              ...row,
              plants: updatedPlants,
            }
          } catch (recalculationError) {
            console.error(`Error recalculating positions after plant removal:`, recalculationError)
            // Fallback: just filter out the removed plant without repositioning
            return {
              ...row,
              plants: (row.plants || []).filter((p) => p.id !== plantInstanceId),
            }
          }
        }
        return row
      })

      setRows(updatedRows)

      // Call server action to remove plant
      console.log(`Calling server action to remove plant ${plantInstanceId}`)
      await removePlantFromRow(plantInstanceId)

      // Update plant usage
      console.log(`Updating plant usage for plant ${plantId} (decrementing)`)
      updatePlantUsage(plantId, false)

      // Reset animation states
      console.log(`Setting timeout to reset animation states`)
      animationTimeoutRef.current = setTimeout(() => {
        setRows((rows) =>
          rows.map((r) => ({
            ...r,
            isActive: false,
          })),
        )
        console.log(`Animation states reset`)
      }, 800)

      toast({
        title: "Flower removed",
        description: "Flower has been removed successfully",
      })
    } catch (error) {
      console.error(`Error removing plant ${plantInstanceId} from row ${rowId}:`, error)

      // Log the full error stack trace
      if (error instanceof Error) {
        console.error(`Error stack trace:`, error.stack)
      }

      // Try to reload rows as a fallback
      console.log(`Attempting to reload rows as fallback`)
      loadRows().catch((reloadError) => {
        console.error(`Failed to reload rows:`, reloadError)
      })

      toast({
        title: "Error",
        description: "Failed to remove flower",
        variant: "destructive",
      })
    }
  }

  const movePlant = async (rowId: number, plantIndex: number, direction: "left" | "right") => {
    clearUsedSpaceCache()
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

  return {
    rows,
    isLoading,
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
    calculateNextPosition,
    clearUsedSpaceCache,
  }
}
