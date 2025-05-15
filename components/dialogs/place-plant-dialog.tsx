"use client"

import { AlertTriangle, Info } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Plant } from "@/hooks/use-plants"
import type { GardenRow } from "@/hooks/use-rows"

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
  addPlantToRow: () => void
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
  const selectedPlantData = selectedPlant ? plants.find((p) => p.id === selectedPlant) : null

  // Calculate position preview for the selected plant
  const getPositionPreview = () => {
    try {
      if (!currentRow || !selectedPlantData) {
        console.log("Cannot calculate position preview: missing row or plant data")
        return null
      }

      console.log(`Calculating position preview for ${selectedPlantData.name} in row ${currentRow.name}`)

      const rowPlants = currentRow.plants || []
      if (rowPlants.length === 0) {
        const position = currentRow.row_ends || 0
        console.log(`No existing plants, position preview after row end: ${position}mm`)
        return position
      }

      const sortedPlants = [...rowPlants].sort((a, b) => a.position - b.position)
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      console.log(
        `Last plant in row: ${lastPlant.name} at position ${lastPlant.position}mm with spacing ${lastPlant.spacing}mm`,
      )

      // The spacing between plants is the maximum of the two plants' spacing requirements
      const spacingBetween = Math.max(lastPlant.spacing, selectedPlantData.spacing)
      console.log(
        `Max spacing between plants: ${spacingBetween}mm (max of ${lastPlant.spacing}mm and ${selectedPlantData.spacing}mm)`,
      )

      // The next position is the last plant's position plus the spacing between
      const nextPosition = lastPlant.position + spacingBetween
      console.log(`Calculated position preview: ${nextPosition}mm`)

      return nextPosition
    } catch (error) {
      console.error("Error calculating position preview:", error)
      return null
    }
  }

  const positionPreview = getPositionPreview()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Flower to Row</DialogTitle>
          <DialogDescription>Select a flower to add to {currentRow?.name || "this row"}.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentRow && (
            <div className="mb-4 p-3 bg-muted/20 rounded-md">
              <h4 className="text-sm font-medium mb-1">Row Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  Length: <span className="font-medium">{currentRow.length} cm</span>
                </div>
                <div>
                  Row Ends: <span className="font-medium">{currentRow.row_ends} cm (each side)</span>
                </div>
                <div>
                  Plants: <span className="font-medium">{currentRow.plants?.length || 0}</span>
                </div>
                {selectedPlantData && positionPreview !== null && (
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center">
                          Position Preview: <span className="font-medium ml-1">{positionPreview} cm</span>
                          <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            This is where the selected plant will be positioned, based on the max spacing rule.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              {selectedPlantData && currentRow.plants && currentRow.plants.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Spacing Rule:</strong> The space between plants is the maximum of their spacing
                    requirements.
                  </p>
                  {positionPreview !== null && (
                    <p className="mt-1">
                      Last plant ({currentRow.plants[currentRow.plants.length - 1].name}) spacing:{" "}
                      {currentRow.plants[currentRow.plants.length - 1].spacing} cm
                      <br />
                      Selected plant ({selectedPlantData.name}) spacing: {selectedPlantData.spacing} cm
                      <br />
                      <strong>Max spacing used:</strong>{" "}
                      {Math.max(currentRow.plants[currentRow.plants.length - 1].spacing, selectedPlantData.spacing)} cm
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
            onClick={addPlantToRow}
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
