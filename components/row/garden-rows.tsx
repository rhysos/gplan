"use client"
import { Plus, Trash2, Edit, Settings, Ruler, Flower, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CloudinaryImage } from "@/components/common/cloudinary-image"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

// TypeScript interfaces
interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

interface PlantInstance {
  id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string | null
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null
}

interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: PlantInstance[]
  isActive?: boolean
}

interface GardenRowsProps {
  rows: GardenRow[]
  viewMode: "list" | "grid"
  isAddingRow: boolean
  setIsAddingRow: (value: boolean) => void
  newRowName: string
  setNewRowName: (value: string) => void
  newRowLength: number
  setNewRowLength: (value: string) => void
  newRowEnds: number
  setNewRowEnds: (value: number) => void
  addRow: () => Promise<void>
  deleteRow: (rowId: number) => Promise<void>
  startEditRow: (row: GardenRow) => void
  addingPlantLoading: number | null
  setAddingPlantToRowId: (rowId: number | null) => void
  setIsAddPlantDialogOpen: (value: boolean) => void
  calculateUsedSpace: (row: GardenRow, newPlant?: Plant) => number
  calculateUsedPercentage: (row: GardenRow) => number
  removePlant: (rowId: number, plantInstanceId: number, plantId: number) => Promise<void>
  movePlant: (rowId: number, plantIndex: number, direction: "left" | "right") => Promise<void>
  movingPlant: boolean
}

export function GardenRows({
  rows,
  viewMode,
  isAddingRow,
  setIsAddingRow,
  newRowName,
  setNewRowName,
  newRowLength,
  setNewRowLength,
  newRowEnds,
  setNewRowEnds,
  addRow,
  deleteRow,
  startEditRow,
  addingPlantLoading,
  setAddingPlantToRowId,
  setIsAddPlantDialogOpen,
  calculateUsedSpace,
  calculateUsedPercentage,
  removePlant,
  movePlant,
  movingPlant,
}: GardenRowsProps) {
  return (
    <>
      {/* Garden Controls */}
      <div className="mb-3">
        <div className="flex items-center">
          <p className="text-muted-foreground flex items-center">
            {rows.length} rows in this garden
            <Button variant="ghost" size="icon" className="ml-2 h-8 w-8" onClick={() => setIsAddingRow(true)}>
              <Plus size={16} />
            </Button>
          </p>
        </div>
      </div>

      {/* Garden Rows */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
            <div className="max-w-md mx-auto">
              <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Ruler size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Rows Yet</h2>
              <p className="text-muted-foreground mb-6">Add your first row to start planning your garden layout.</p>
              <Button onClick={() => setIsAddingRow(true)} className="bg-primary hover:bg-primary/90">
                <Plus size={16} className="mr-2" />
                Add Your First Row
              </Button>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {rows.map((row) => {
              const usedSpace = calculateUsedSpace(row)
              const usedPercentage = calculateUsedPercentage(row)
              const isNearlyFull = usedPercentage > 90

              return (
                <div
                  key={row.id}
                  className={`garden-row p-3 ${row.isActive ? "ring-2 ring-primary" : ""}`}
                  data-active={row.isActive}
                >
                  {/* Row Header */}
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3"
                              onClick={() => {
                                setAddingPlantToRowId(row.id)
                                setIsAddPlantDialogOpen(true)
                              }}
                              disabled={addingPlantLoading === row.id}
                            >
                              {addingPlantLoading === row.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                              ) : (
                                <>
                                  <Flower size={14} className="mr-1" />
                                  <span>Add Plant</span>
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add a flower to this row</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Settings size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditRow(row)}>
                            <Edit size={14} className="mr-2" />
                            Edit Row
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-destructive">
                            <Trash2 size={14} className="mr-2" />
                            Delete Row
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Space Usage</span>
                      <Badge variant={isNearlyFull ? "destructive" : "outline"} className="text-xs">
                        {(() => {
                          try {
                            const percentage = calculateUsedPercentage(row)
                            return `${percentage}%`
                          } catch (error) {
                            console.error(`Error calculating percentage for row ${row.id}:`, error)
                            return "Error"
                          }
                        })()}
                      </Badge>
                    </div>
                    <Progress
                      value={(() => {
                        try {
                          return calculateUsedPercentage(row)
                        } catch (error) {
                          console.error(`Error calculating progress value for row ${row.id}:`, error)
                          return 0
                        }
                      })()}
                      className="h-2"
                      indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
                    />
                  </div>
                   {/* Visualization */}
      <RowVisualization
        row={{
          ...row,
          isNearlyFull,
          usedPercentage,
        }}
        movePlant={movePlant}
        removePlant={removePlant}
        movingPlant={movingPlant}
      />
                </div>
              )
            })}
          </div>
        ) : (
          // Grid View
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setAddingPlantToRowId(row.id)
                                setIsAddPlantDialogOpen(true)
                              }}
                            >
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
                          <DropdownMenuItem onClick={() => startEditRow(row)}>
                            <Edit size={14} className="mr-2" />
                            Edit Row
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-destructive">
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
        )}
      </div>
    </>
  )
}
