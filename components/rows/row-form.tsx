"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface RowFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (row: { name: string; length: number; row_ends?: number }) => Promise<any>
  gardenId: number
  initialRow?: { id: number; name: string; length: number; row_ends?: number } | null
}

export function RowForm({ open, onOpenChange, onSubmit, gardenId, initialRow = null }: RowFormProps) {
  const [name, setName] = useState(initialRow?.name || "")
  const [length, setLength] = useState(initialRow?.length || 6000)
  const [rowEnds, setRowEnds] = useState(initialRow?.row_ends || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || length <= 0) return

    setIsSubmitting(true)
    try {
      await onSubmit({ name, length, row_ends: rowEnds })
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting row form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    if (!initialRow) {
      setName("")
      setLength(6000)
      setRowEnds(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialRow ? "Edit Row" : "Add New Row"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="row-name">Row Name</Label>
              <Input
                id="row-name"
                placeholder="Enter row name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="row-length">Row Length (mm)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="row-length"
                  value={[length]}
                  onValueChange={(values) => setLength(values[0])}
                  min={1000}
                  max={10000}
                  step={100}
                  className="flex-1"
                />
                <span className="w-16 text-right">{length} mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="row-ends">Row Ends (mm)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="row-ends"
                  value={[rowEnds]}
                  onValueChange={(values) => setRowEnds(values[0])}
                  min={0}
                  max={1000}
                  step={10}
                  className="flex-1"
                />
                <span className="w-16 text-right">{rowEnds} mm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Space reserved at each end of the row (e.g., for stakes or supports)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !name.trim() || length <= 0}>
              {isSubmitting ? "Saving..." : initialRow ? "Update Row" : "Add Row"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
