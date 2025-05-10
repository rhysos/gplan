"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { PlantCard } from "./plant-card"
import { wouldPlantFit } from "@/utils/garden-utils"

interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity: number
}

interface Row {
  id: number
  garden_id: number
  name: string
  length: number
  position: number
  row_ends?: number
}

interface PlantSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plants: Plant[]
  usageCounts: Record<number, number>
  onSelectPlant: (plantId: number) => Promise<void>
  rowId: number
  rows: Row[]
}

export function PlantSelector({
  open,
  onOpenChange,
  plants,
  usageCounts,
  onSelectPlant,
  rowId,
  rows,
}: PlantSelectorProps) {
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentRow = rows.find((r) => r.id === rowId)

  const handleSelectPlant = async () => {
    if (!selectedPlantId) return

    setIsSubmitting(true)
    try {
      await onSelectPlant(selectedPlantId)
      setSelectedPlantId(null)
      setSearchQuery("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPlants = plants.filter((plant) => plant.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Plant to Row</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plants..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 grid gap-2">
            {filteredPlants.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No plants found</p>
            ) : (
              filteredPlants.map((plant) => {
                const usedCount = usageCounts[plant.id] || 0
                const available = plant.quantity - usedCount
                const canFit = currentRow ? wouldPlantFit(currentRow, plant) : true

                return (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    available={available}
                    canFit={canFit}
                    isSelected={selectedPlantId === plant.id}
                    onClick={() => {
                      if (available > 0 && canFit) {
                        setSelectedPlantId(plant.id)
                      }
                    }}
                  />
                )
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSelectPlant} disabled={!selectedPlantId || isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Plant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
