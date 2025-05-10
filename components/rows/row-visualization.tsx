"use client"

import { useState } from "react"
import type { Plant, PlantInstance, Row } from "@/types"
import { CloudinaryImage } from "../cloudinary-image"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { PlantSelector } from "../plants/plant-selector"
import { addPlantToRow, removePlantFromRow } from "@/lib/actions"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

interface RowVisualizationProps {
  row: Row
  plants: PlantInstance[]
  availablePlants: Plant[]
}

export function RowVisualization({ row, plants, availablePlants }: RowVisualizationProps) {
  const [isAddingPlant, setIsAddingPlant] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(0)

  // Sort plants by position
  const sortedPlants = [...plants].sort((a, b) => a.position - b.position)

  // Calculate total cm used by plants
  const totalCmUsed = sortedPlants.reduce((total, plant) => {
    return total + plant.spacing
  }, 0)

  // Calculate available cm (accounting for row ends)
  const availableCm = row.length - totalCmUsed - row.row_ends

  // Function to handle plant selection
  const handlePlantSelect = async (plantId: number) => {
    try {
      // Adjust position to account for row ends (left end)
      const adjustedPosition = selectedPosition + row.row_ends / 2

      await addPlantToRow(row.id, plantId, adjustedPosition)
      setIsAddingPlant(false)
      toast.success("Plant added to row")
    } catch (error) {
      console.error("Error adding plant:", error)
      toast.error("Failed to add plant")
    }
  }

  // Function to handle plant removal
  const handleRemovePlant = async (instanceId: number) => {
    try {
      await removePlantFromRow(instanceId)
      toast.success("Plant removed from row")
    } catch (error) {
      console.error("Error removing plant:", error)
      toast.error("Failed to remove plant")
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">
          {availableCm} cm available ({totalCmUsed} cm used)
        </div>
        <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={availableCm <= 0}>
              Add Plant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Plant</DialogTitle>
            </DialogHeader>
            <PlantSelector
              plants={availablePlants}
              onSelect={handlePlantSelect}
              availableSpace={availableCm}
              rowLength={row.length}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full h-16 bg-gray-100 rounded-md overflow-hidden">
        {/* Left row end visualization */}
        {row.row_ends > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-amber-200 border-r border-amber-300"
            style={{ width: `${(row.row_ends / 2 / row.length) * 100}%` }}
            title={`Left row end: ${row.row_ends / 2} cm`}
          >
            <div className="flex items-center justify-center h-full text-xs text-amber-800">End</div>
          </div>
        )}

        {/* Right row end visualization */}
        {row.row_ends > 0 && (
          <div
            className="absolute right-0 top-0 h-full bg-amber-200 border-l border-amber-300"
            style={{ width: `${(row.row_ends / 2 / row.length) * 100}%` }}
            title={`Right row end: ${row.row_ends / 2} cm`}
          >
            <div className="flex items-center justify-center h-full text-xs text-amber-800">End</div>
          </div>
        )}

        {/* Plants visualization */}
        {sortedPlants.map((plant) => {
          // Calculate position percentage, accounting for row ends
          const positionPercentage = (plant.position / row.length) * 100
          const widthPercentage = (plant.spacing / row.length) * 100

          return (
            <TooltipProvider key={plant.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute top-0 h-full flex items-center justify-center bg-white border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      left: `${positionPercentage}%`,
                      width: `${widthPercentage}%`,
                    }}
                    onClick={() => handleRemovePlant(plant.id)}
                  >
                    {plant.image_url && (
                      <CloudinaryImage
                        src={plant.image_url}
                        alt={plant.name}
                        width={40}
                        height={40}
                        className="object-cover w-8 h-8"
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{plant.name}</p>
                  <p className="text-xs text-gray-500">Position: {plant.position} cm</p>
                  <p className="text-xs text-gray-500">Spacing: {plant.spacing} cm</p>
                  <p className="text-xs text-gray-500">Click to remove</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}

        {/* Position selector for adding plants */}
        {isAddingPlant && (
          <div
            className="absolute top-0 h-full bg-blue-200 opacity-50 cursor-move"
            style={{
              left: `${((selectedPosition + row.row_ends / 2) / row.length) * 100}%`,
              width: "10px",
            }}
          />
        )}

        {/* Click handler for selecting position */}
        <div
          className="absolute top-0 left-0 w-full h-full cursor-pointer"
          onClick={(e) => {
            if (!isAddingPlant) return

            const rect = e.currentTarget.getBoundingClientRect()
            const clickPositionPercentage = (e.clientX - rect.left) / rect.width

            // Calculate position in cm, accounting for row ends
            let rawPosition = clickPositionPercentage * row.length

            // Adjust for row ends (subtract the left end)
            rawPosition = Math.max(0, rawPosition - row.row_ends / 2)

            // Ensure position is within plantable area
            const maxPosition = row.length - row.row_ends / 2
            rawPosition = Math.min(rawPosition, maxPosition)

            setSelectedPosition(Math.round(rawPosition))
          }}
        />
      </div>
    </div>
  )
}
