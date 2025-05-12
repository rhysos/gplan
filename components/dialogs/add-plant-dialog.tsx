"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: any[]
  isActive?: boolean
}

interface AddPlantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plants: Plant[]
  rows: GardenRow[]
  selectedPlant: number | null
  setSelectedPlant: (id: number | null) => void
  addingPlantToRowId: number | null
  setAddingPlantToRowId: (id: number | null) => void
  addingPlantLoading: number | null
  usageCounts: Record<number, number>
  wouldPlantFit: (row: GardenRow, plant: Plant) => boolean
  addPlantToRow: (rowId: number) => Promise<void>
}

export function AddPlantDialog({
  open,
  onOpenChange,
  plants,
  rows,
  selectedPlant,
  setSelectedPlant,
  addingPlantToRowId,
  setAddingPlantToRowId,
  addingPlantLoading,
  usageCounts,
  wouldPlantFit,
  addPlantToRow,
}: AddPlantDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
    setAddingPlantToRowId(null)
    setSelectedPlant(null)
  }

  const currentRow = rows.find((r) => r.id === addingPlantToRowId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Flower to Row</DialogTitle>
          <DialogDescription>Select a flower to add to {currentRow?.name || "this row"}.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="plant-select" className="mb-2 block">
            Select a flower:
          </Label>
          <div className="h-[300px] rounded-md border overflow-y-auto p-1">
            {plants.map((plant) => {
              // Calculate availability
              const quantity = plant.quantity || 0
              const usedCount = usageCounts[plant.id] || 0
              const available = quantity - usedCount

              // Check if plant would fit in the row
              const canFit = addingPlantToRowId && currentRow ? wouldPlantFit(currentRow, plant) : true

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
                    <img
                      src={plant.image_url || "/placeholder.svg"}
                      alt={plant.name}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
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
              <>Add Flower</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
