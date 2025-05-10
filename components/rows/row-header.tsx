"use client"

import { Flower, Ruler, Settings, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { GardenRow } from "@/types"

interface RowHeaderProps {
  row: GardenRow
  usedSpace: number
  onAddPlant: () => void
  onEditRow: () => void
  onDeleteRow: () => void
  isAddingPlant: boolean
}

export function RowHeader({ row, usedSpace, onAddPlant, onEditRow, onDeleteRow, isAddingPlant }: RowHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
      <div>
        <h3 className="text-xl font-semibold">{row.name}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Ruler size={14} />
            <span>{row.length} cm</span>
          </div>
          <div>•</div>
          <div>
            <span>{(row.plants || []).length} plants</span>
          </div>
          <div>•</div>
          <div>
            <span>{usedSpace} cm used</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3" onClick={onAddPlant} disabled={isAddingPlant}>
                {isAddingPlant ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                ) : (
                  <>
                    <Flower size={14} className="mr-1" />
                    <span>Add Flower</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a flower to this row</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Row settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditRow}>
              <Edit size={14} className="mr-2" />
              Edit Row
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteRow} className="text-destructive">
              <Trash2 size={14} className="mr-2" />
              Delete Row
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
