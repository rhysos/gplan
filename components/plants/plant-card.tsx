"use client"

import { CloudinaryImage } from "@/components/cloudinary-image"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import type { Plant } from "@/types"

interface PlantCardProps {
  plant: Plant & { available?: number }
  isSelected: boolean
  isDisabled: boolean
  canFit: boolean
  onClick: () => void
}

export function PlantCard({ plant, isSelected, isDisabled, canFit, onClick }: PlantCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 my-1 rounded-md cursor-pointer transition-colors ${
        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
      } ${isSelected ? "bg-primary/10 border border-primary/30" : "border border-transparent"}`}
    >
      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
        <CloudinaryImage
          src={plant.image_url}
          alt={plant.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{plant.name}</span>
          <Badge variant={(plant.available || 0) > 0 ? "outline" : "destructive"} className="ml-2">
            {plant.available} left
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
}
