"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GardenFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<any>
  initialValue?: string
  title: string
  description: string
  submitLabel: string
}

export function GardenForm({
  isOpen,
  onOpenChange,
  onSubmit,
  initialValue = "",
  title,
  description,
  submitLabel,
}: GardenFormProps) {
  const [name, setName] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (name.trim() === "") return

    setIsSubmitting(true)
    try {
      await onSubmit(name)
      setName("")
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
            <Label htmlFor="garden-name">Garden Name</Label>
            <Input
              id="garden-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Backyard Garden"
              className="col-span-3"
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
