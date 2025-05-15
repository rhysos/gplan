"use client"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RowVisualization } from "@/components/row/row-visual"

interface SimplifiedGardenViewProps {
  isOpen: boolean
  onClose: () => void
  rows: Array<{
    id: number
    name: string
    length: number
    row_ends: number
    plants?: Array<{
      id: number
      position: number
      spacing: number
      image_url: string | null
      name: string
    }>
    usedPercentage: number
  }>
  gardenName: string
}

export function SimplifiedGardenView({ isOpen, onClose, rows, gardenName }: SimplifiedGardenViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle escape key to close the view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Dummy functions for the RowVisualization component
  const dummyMovePlant = () => {}
  const dummyRemovePlant = async () => {}

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 overflow-auto">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{gardenName} - Garden View</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div ref={containerRef} className="space-y-6">
          {rows.map((row) => (
            <div key={row.id} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-2">{row.name}</h2>
              <div className="h-48 overflow-x-auto overflow-y-hidden">
                <RowVisualization
                  row={row}
                  movePlant={dummyMovePlant}
                  removePlant={dummyRemovePlant}
                  movingPlant={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
