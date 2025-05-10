"use client"

import type React from "react"

import { useState } from "react"
import { createGardenRow, updateGardenRow } from "@/lib/actions"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { toast } from "sonner"
import type { Row } from "@/types"

interface RowFormProps {
  gardenId: number
  onSuccess?: () => void
  existingRow?: Row
}

export function RowForm({ gardenId, onSuccess, existingRow }: RowFormProps) {
  const [name, setName] = useState(existingRow?.name || "")
  const [length, setLength] = useState(existingRow?.length.toString() || "100")
  const [rowEnds, setRowEnds] = useState(existingRow?.row_ends.toString() || "0")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const lengthValue = Number.parseInt(length)
      const rowEndsValue = Number.parseInt(rowEnds)

      if (isNaN(lengthValue) || lengthValue <= 0) {
        toast.error("Length must be a positive number")
        setIsSubmitting(false)
        return
      }

      if (isNaN(rowEndsValue) || rowEndsValue < 0) {
        toast.error("Row ends must be a non-negative number")
        setIsSubmitting(false)
        return
      }

      if (rowEndsValue >= lengthValue) {
        toast.error("Row ends cannot be larger than or equal to the row length")
        setIsSubmitting(false)
        return
      }

      if (existingRow) {
        await updateGardenRow(existingRow.id, name, lengthValue, rowEndsValue)
        toast.success("Row updated successfully")
      } else {
        await createGardenRow(gardenId, name, lengthValue, rowEndsValue)
        toast.success("Row created successfully")
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error submitting row:", error)
      toast.error("Failed to save row")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Row Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tomatoes" required />
      </div>
      <div>
        <Label htmlFor="length">Length (cm)</Label>
        <Input id="length" type="number" value={length} onChange={(e) => setLength(e.target.value)} min="1" required />
      </div>
      <div>
        <Label htmlFor="rowEnds">
          Row Ends (cm)
          <span className="ml-2 text-xs text-gray-500">Space reserved at both ends of the row</span>
        </Label>
        <Input
          id="rowEnds"
          type="number"
          value={rowEnds}
          onChange={(e) => setRowEnds(e.target.value)}
          min="0"
          required
        />
        {Number.parseInt(rowEnds) > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {Number.parseInt(rowEnds) / 2} cm will be reserved at each end of the row
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : existingRow ? "Update Row" : "Create Row"}
      </Button>
    </form>
  )
}
