"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getRows,
  createRow as createRowAction,
  updateRow as updateRowAction,
  deleteRow as deleteRowAction,
  moveRowUp as moveRowUpAction,
  moveRowDown as moveRowDownAction,
} from "@/lib/actions"

export interface Row {
  id: number
  garden_id: number
  name: string
  length: number
  position: number
  row_ends?: number
}

export function useRows(gardenId: number | undefined) {
  const { toast } = useToast()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [isLoadingRows, setIsLoadingRows] = useState(true)

  // Store the gardenId in a ref to avoid dependency issues
  const [currentGardenId, setCurrentGardenId] = useState<number | undefined>(gardenId)

  // Fetch rows when gardenId changes
  useEffect(() => {
    // Update the stored gardenId when it changes
    if (gardenId !== currentGardenId) {
      setCurrentGardenId(gardenId)
    }

    let isMounted = true

    async function fetchRows() {
      if (!gardenId) {
        if (isMounted) {
          setRows([])
          setIsLoadingRows(false)
        }
        return
      }

      try {
        setIsLoadingRows(true)
        const fetchedRows = await getRows(gardenId)

        if (isMounted) {
          setRows(fetchedRows)
        }
      } catch (error) {
        console.error("Error fetching rows:", error)
        if (isMounted) {
          setRows(null)
          toast({
            title: "Error",
            description: "Failed to load rows. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingRows(false)
        }
      }
    }

    fetchRows()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [gardenId]) // Only depend on gardenId

  // Create a new row
  const createRow = async (row: { name: string; length: number; row_ends?: number }) => {
    if (!gardenId) return null

    try {
      const newRow = await createRowAction(gardenId, row.name, row.length, row.row_ends || 0)
      if (rows) {
        setRows([...rows, newRow])
      }
      toast({
        title: "Success",
        description: "Row created successfully!",
      })
      return newRow
    } catch (error) {
      console.error("Error creating row:", error)
      toast({
        title: "Error",
        description: "Failed to create row. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Update an existing row
  const updateRow = async (id: number, row: { name: string; length: number; row_ends?: number }) => {
    try {
      const updatedRow = await updateRowAction(id, row.name, row.length, row.row_ends || 0)
      if (rows) {
        setRows(rows.map((r) => (r.id === id ? updatedRow : r)))
      }
      toast({
        title: "Success",
        description: "Row updated successfully!",
      })
      return updatedRow
    } catch (error) {
      console.error("Error updating row:", error)
      toast({
        title: "Error",
        description: "Failed to update row. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Delete a row
  const deleteRow = async (id: number) => {
    try {
      await deleteRowAction(id)
      if (rows) {
        setRows(rows.filter((r) => r.id !== id))
      }
      toast({
        title: "Success",
        description: "Row deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting row:", error)
      toast({
        title: "Error",
        description: "Failed to delete row. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Move a row up in position
  const moveRowUp = async (id: number) => {
    try {
      await moveRowUpAction(id)
      // Refresh rows after moving
      if (gardenId) {
        const updatedRows = await getRows(gardenId)
        setRows(updatedRows)
      }
    } catch (error) {
      console.error("Error moving row up:", error)
      toast({
        title: "Error",
        description: "Failed to move row. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Move a row down in position
  const moveRowDown = async (id: number) => {
    try {
      await moveRowDownAction(id)
      // Refresh rows after moving
      if (gardenId) {
        const updatedRows = await getRows(gardenId)
        setRows(updatedRows)
      }
    } catch (error) {
      console.error("Error moving row down:", error)
      toast({
        title: "Error",
        description: "Failed to move row. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    rows: rows || [],
    isLoadingRows,
    createRow,
    updateRow,
    deleteRow,
    moveRowUp,
    moveRowDown,
  }
}
