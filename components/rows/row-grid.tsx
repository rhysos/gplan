"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Flower, Settings, Edit, Trash2 } from "lucide-react"
import type { GardenRow } from "@/types"
import { calculateUsedSpace, calculateUsedPercentage } from "@/utils/garden-utils"

interface RowGridProps {
  rows: GardenRow[]
  onEditRow: (row: GardenRow) => void
  onDeleteRow: (rowId: number) => Promise<boolean>
  onAddPlant: (rowId: number) => void
}

export function RowGrid({ rows, onEditRow, onDeleteRow, onAddPlant }: RowGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rows.map((row) => {
        const usedSpace = calculateUsedSpace(row)
        const usedPercentage = calculateUsedPercentage(row)
        const isNearlyFull = usedPercentage > 90
        const plantCount = (row.plants || []).length

        return (
          <div
            key={row.id}
            className={`garden-row p-3 hover-card ${row.isActive ? "ring-2 ring-primary" : ""}`}
            data-active={row.isActive}
          >
            {/* Row Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{row.name}</h3>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddPlant(row.id)}>
                        <Flower size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add a flower to this row</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRow(row)}>
                      <Edit size={14} className="mr-2" />
                      Edit Row
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteRow(row.id)} className="text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      Delete Row
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row Stats */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground">Length</p>
                <p className="font-medium">{row.length} cm</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground">Plants</p>
                <p className="font-medium">{plantCount}</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-xs text-muted-foreground">Used</p>
                <p className="font-medium">{usedPercentage}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress
              value={usedPercentage}
              className="h-2 mb-2"
              indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
            />

            {/* Plant Preview */}
            <div className="flex items-center justify-center gap-1 h-16 bg-muted/20 rounded-md overflow-hidden">
              {plantCount > 0 ? (
                <div className="flex items-center">
                  {(row.plants || [])
                    .filter((p) => p && p.image_url)
                    .slice(0, 5)
                    .map((plant, i) => (
                      <div key={plant.id} className="relative -ml-2 first:ml-0" style={{ zIndex: 5 - i }}>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background">
                          <CloudinaryImage
                            src={plant.image_url || "/placeholder.svg?height=40&width=40"}
                            alt={plant.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  {plantCount > 5 && (
                    <Badge variant="secondary" className="ml-1">
                      +{plantCount - 5} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No plants added yet</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
