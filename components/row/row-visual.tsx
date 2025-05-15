"use client"
import type React from "react"
import { CloudinaryImage } from "@/components/common/cloudinary-image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"

// TypeScript interfaces for props
interface PlantInstance {
  id: number
  position: number
  spacing: number
  image_url: string | null
  name: string
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null
}

interface RowVisualizationProps {
  row: {
    id: number
    name: string
    length: number
    row_ends: number
    plants?: PlantInstance[]
    isNearlyFull?: boolean
    usedPercentage: number
  }
  movePlant: (rowId: number, plantIndex: number, direction: "left" | "right") => void
  removePlant: (rowId: number, plantInstanceId: number, plantId: number) => Promise<void>
  movingPlant: boolean
}

export const RowVisualization: React.FC<RowVisualizationProps> = ({ row, movePlant, removePlant, movingPlant }) => {
  return (
    <div className="relative h-full rounded-lg bg-muted/20">
      <div
        className="relative top-0 left-0 h-full items-center inline-block"
        style={{
          width: `${row.length * 3}px`,
          minWidth: `${row.length * 3}px`,
          maxWidth: `${row.length * 3}px`,
          position: "relative",
        }}
      >
        {/* Visualize Ruler */}
        {Array.from({ length: Math.ceil(row.length / 100) + 1 }).map((_, i) => (
          <div key={i} className="absolute h-full" style={{ left: `${i * 300}px` }}>
            <div className="absolute bottom-0 h-4 border-l border-muted-foreground/30"></div>
            <div className="absolute bottom-0 text-xs text-muted-foreground" style={{ left: "4px" }}>
              {i}m
            </div>
          </div>
        ))}

        {/* Row ends visualization */}
        {row.row_ends > 0 && (
          <>
            {/* Left end */}
            <div
              className="absolute top-2 bottom-6 border border-dashed rounded-md"
              style={{
                left: 0,
                width: `${row.row_ends * 3}px`,
                backgroundColor: "rgba(138, 161, 177, 0.1)",
                borderColor: "rgba(138, 161, 177, 0.3)",
              }}
            >
              <div className="h-full flex items-center justify-center">
                <span className="text-xs rotate-90 text-muted-foreground">Row end</span>
              </div>
            </div>

            {/* Right end */}
            <div
              className="absolute top-2 bottom-6 border border-dashed rounded-md"
              style={{
                right: `0px`,
                left: `auto`,
                width: `${row.row_ends * 3}px`,
                transform: `translateX(-100%)`,
                marginLeft: `${row.row_ends * 3}px`,
                backgroundColor: "rgba(138, 161, 177, 0.1)",
                borderColor: "rgba(138, 161, 177, 0.3)",
              }}
            >
              <div className="h-full flex items-center justify-center">
                <span className="text-xs rotate-90 text-muted-foreground">Row end</span>
              </div>
            </div>
          </>
        )}

        {/* Plants */}
        {(row.plants || [])
          .filter((plantInstance) => plantInstance && typeof plantInstance === "object")
          .sort((a, b) => a.position - b.position)
          .map((plantInstance, index, sortedPlants) => {
            const isFirst = index === 0
            const isLast = index === sortedPlants.length - 1

            // Determine animation class
            let animationClass = ""
            if (plantInstance.animationState === "entering") animationClass = "plant-enter"
            if (plantInstance.animationState === "exiting") animationClass = "plant-exit"
            if (plantInstance.animationState === "moving-left") animationClass = "plant-move-left"
            if (plantInstance.animationState === "moving-right") animationClass = "plant-move-right"

            return (
              <div
                key={plantInstance.id}
                className="plant-container absolute top-2 bottom-6 group"
                style={{
                  left: `${plantInstance.position * 3}px`,
                  width: `${plantInstance.spacing * 3}px`,
                }}
              >
                <div
                  className={`plant-card h-full flex flex-col relative bg-white dark:bg-gray-800 shadow-sm ${animationClass}`}
                >
                  {/* Plant image */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <CloudinaryImage
                      src={plantInstance.image_url || "/placeholder.svg?height=80&width=80"}
                      alt={plantInstance.name || "Flower"}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 text-center">
                      <p className="text-xs font-medium truncate text-white">
                        {plantInstance.name || "Unknown Flower"}
                      </p>
                    </div>

                    {/* Hover actions overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {/* Move left button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 rounded-full bg-white/90 ${isFirst ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => !isFirst && !movingPlant && movePlant(row.id, index, "left")}
                        disabled={isFirst || movingPlant}
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-800" />
                      </Button>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-white/90 text-red-600 hover:bg-red-100"
                        onClick={() => removePlant(row.id, plantInstance.id, plantInstance.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {/* Move right button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 rounded-full bg-white/90 ${isLast ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => !isLast && !movingPlant && movePlant(row.id, index, "right")}
                        disabled={isLast || movingPlant}
                      >
                        <ChevronRight className="h-4 w-4 text-gray-800" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
