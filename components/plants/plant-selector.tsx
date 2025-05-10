"use client"

import { useState } from "react"
import { Flower } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Plant, GardenRow } from "@/types"
import { PlantCard } from "./plant-card"
import { wouldPlantFit } from "@/utils/garden-utils"

interface PlantSelectorProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  plants: (Plant & { available?: number })[]
  selectedRow: GardenRow | null
  onAddPlant: (plantId: number) => Promise<void>
  isLoading: boolean
}

export function PlantSelector({
  isOpen,
  onOpenChange,
  plants,
  selectedRow,
  onAddPlant,
  isLoading,
}: PlantSelectorProps) {
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)

  const handleClose = () => {
    setSelectedPlant(null)
    onOpenChange(false)
  }

  const handleAddPlant = async () => {
    if (selectedPlant) {
      await onAddPlant(selectedPlant)
      setSelectedPlant(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Flower to Row</DialogTitle>
          <DialogDescription>Select a flower to add to {selectedRow?.name || "this row"}.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="plant-select" className="mb-2 block">
            Select a flower:
          </Label>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-1">
              {plants.map((plant) => {
                const canFit = selectedRow ? wouldPlantFit(selectedRow, plant) : true
                const isDisabled = (plant.available || 0) <= 0 || !canFit
                const isSelected = selectedPlant === plant.id

                return (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    canFit={canFit}
                    onClick={() => {
                      if (!isDisabled && !isLoading) {
                        setSelectedPlant(plant.id)
                      }
                    }}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPlant}
            disabled={!selectedPlant || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Flower className="h-4 w-4 mr-2" />
                Add Flower
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
