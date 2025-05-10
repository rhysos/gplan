"use client"

import type React from "react"

import { useState } from "react"
import { Save, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { GardenRow } from "@/types"

interface RowFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, length: number, rowEnds: number) => Promise<any>
  initialValues?: Partial<GardenRow>
  title: string
  description: string
  submitLabel: string
}

export function RowForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialValues = {},
  title,
  description,
  submitLabel,
}: RowFormProps) {
  const [name, setName] = useState(initialValues.name || "")
  const [length, setLength] = useState(initialValues.length || 240)
  const [rowEnds, setRowEnds] = useState(initialValues.row_ends || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (name.trim() === "") return

    setIsSubmitting(true)
    try {
      await onSubmit(name, length, rowEnds)
      if (!initialValues.id) {
        // Only reset if this is a new row
        setName("")
        setLength(240)
        setRowEnds(0)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="row-name">Row Name</Label>
            <Input id="row-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tulip Row" />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="row-length">Row Length</Label>
              <span className="text-sm text-muted-foreground">
                {length} cm ({(length / 100).toFixed(1)} m)
              </span>
            </div>
            <Slider
              id="row-length"
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
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
              value={rowEnds}
              onChange={(e) => setRowEnds(Number(e.target.value))}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select()}
              placeholder="e.g., 10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
            ) : (
              submitLabel.includes("Save") && <Save size={16} className="mr-2" />
            )}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
