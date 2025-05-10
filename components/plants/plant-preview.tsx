"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
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

interface PlantPreviewProps {
  rowId: number
}

export function PlantPreview({ rowId }: PlantPreviewProps) {
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
    return <div className="h-16 flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  if (plants.length === 0) {
    return <div className="h-16 flex items-center justify-center text-muted-foreground">No plants in this row yet</div>
  }

  return (
    <div className="flex items-center justify-center gap-1 h-16 bg-muted/20 rounded-md overflow-hidden p-2">
      <div className="flex items-center">
        {plants.slice(0, 5).map((plant, i) => (
          <div key={plant.id} className="relative -ml-2 first:ml-0" style={{ zIndex: 5 - i }}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background relative">
              <Image
                src={plant.image_url || "/placeholder.svg?height=40&width=40"}
                alt={plant.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}

        {plants.length > 5 && (
          <Badge variant="secondary" className="ml-1">
            +{plants.length - 5} more
          </Badge>
        )}
      </div>
    </div>
  )
}
