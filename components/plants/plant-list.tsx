"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { getPlantsByRow } from "@/lib/actions"
import Image from "next/image"

interface PlantInstance {
  id: number
  row_id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string
}

interface PlantListProps {
  rowId: number
  onRemovePlant: (plantInstanceId: number, plantId: number) => Promise<void>
  onMovePlantLeft: (plantInstanceId: number) => Promise<void>
  onMovePlantRight: (plantInstanceId: number) => Promise<void>
}

export function PlantList({ rowId, onRemovePlant, onMovePlantLeft, onMovePlantRight }: PlantListProps) {
  const [plants, setPlants] = useState<PlantInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPlants() {
      try {
        setIsLoading(true)
        const rowPlants = await getPlantsByRow(rowId)
        setPlants(rowPlants)
      } catch (error) {
        console.error("Error loading plants:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlants()
  }, [rowId])

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Loading plants...</div>
  }

  if (plants.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">No plants in this row yet</div>
  }

  // Sort plants by position
  const sortedPlants = [...plants].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-2">
      {sortedPlants.map((plant, index) => {
        const isFirst = index === 0
        const isLast = index === sortedPlants.length - 1

        return (
          <div key={plant.id} className="flex items-center gap-2 p-2 rounded-md border bg-background">
            <div className="w-10 h-10 rounded-md overflow-hidden relative">
              <Image
                src={plant.image_url || "/placeholder.svg?height=40&width=40"}
                alt={plant.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="font-medium text-sm">{plant.name}</div>
              <div className="text-xs text-muted-foreground">
                Position: {plant.position} mm • Spacing: {plant.spacing} mm
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={isFirst}
                onClick={() => onMovePlantLeft(plant.id)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-destructive hover:text-destructive"
                onClick={() => onRemovePlant(plant.id, plant.plant_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={isLast}
                onClick={() => onMovePlantRight(plant.id)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
