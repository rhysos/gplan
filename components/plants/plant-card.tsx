"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity: number
}

interface PlantCardProps {
  plant: Plant
  available: number
  canFit: boolean
  isSelected: boolean
  onClick: () => void
}

export function PlantCard({ plant, available, canFit, isSelected, onClick }: PlantCardProps) {
  const isDisabled = available <= 0 || !canFit

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer",
        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50",
        isSelected ? "bg-primary/10 border-primary/30" : "border-transparent",
      )}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative">
        <Image
          src={plant.image_url || "/placeholder.svg?height=48&width=48"}
          alt={plant.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{plant.name}</span>
          <Badge variant={available > 0 ? "outline" : "destructive"} className="ml-2">
            {available} left
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">Spacing: {plant.spacing} mm</div>
      </div>

      {!canFit && (
        <div className="text-amber-500 flex items-center text-xs whitespace-nowrap">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Won't fit
        </div>
      )}
    </div>
  )
}
