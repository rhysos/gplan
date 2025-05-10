"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { GardenRow } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { getGardenRows, createGardenRow, updateGardenRow, deleteGardenRow, getRowPlants } from "@/lib/actions"

export function useRows(gardenId: number | null) {
  const { toast } = useToast()
  const [rows, setRows] = useState<GardenRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up any animation timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  // Load rows when garden changes
  const loadRows = useCallback(async () => {
    if (!gardenId) return

    setIsLoading(true)
    try {
      const gardenRows = await getGardenRows(gardenId)

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
    } finally {
      setIsLoading(false)
    }
  }, [gardenId, toast])

  // Call loadRows when gardenId changes
  useEffect(() => {
    loadRows()
  }, [gardenId, loadRows])

  const addRow = async (name: string, length: number, rowEnds = 0) => {
    if (name.trim() === "" || !gardenId) return null

    try {
      const newRow = await createGardenRow(gardenId, name, length, rowEnds)
      setRows([...rows, { ...newRow, plants: [] }])

      toast({
        title: "Row added",
        description: `${newRow.name} has been added successfully`,
      })

      return newRow
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive",
      })
      return null
    }
  }

  const updateRow = async (rowId: number, name: string, length: number, rowEnds = 0) => {
    try {
      const updatedRow = await updateGardenRow(rowId, name, length, rowEnds)
      setRows(rows.map((row) => (row.id === rowId ? { ...updatedRow, plants: row.plants } : row)))

      toast({
        title: "Row updated",
        description: `${updatedRow.name} has been updated successfully`,
      })

      return updatedRow
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive",
      })
      return null
    }
  }

  const removeRow = async (rowId: number) => {
    try {
      await deleteGardenRow(rowId)
      setRows(rows.filter((row) => row.id !== rowId))

      toast({
        title: "Row deleted",
        description: "Row has been deleted successfully",
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      })
      return false
    }
  }

  const setRowActive = (rowId: number, isActive: boolean) => {
    setRows(
      rows.map((r) => ({
        ...r,
        isActive: r.id === rowId ? isActive : r.isActive,
      })),
    )
  }

  const clearAllRowAnimations = (delay = 800) => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

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
    }, delay)
  }

  return {
    rows,
    isLoading,
    loadRows,
    addRow,
    updateRow,
    removeRow,
    setRowActive,
    clearAllRowAnimations,
    setRows,
    animationTimeoutRef,
  }
}
