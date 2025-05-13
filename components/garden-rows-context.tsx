"use client"
import { Plus, Trash2, Edit, Settings, Ruler, Flower, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useGardenContext } from "@/context/GardenContext"
import { memo, useMemo } from "react"

// Create a memoized row component to prevent unnecessary re-renders
const MemoizedRow = memo(
  ({
    row,
    addingPlantLoading,
    movingPlant,
    setAddingPlantToRowId,
    setIsAddPlantDialogOpen,
    startEditRow,
    deleteRow,
    calculateUsedSpace,
    calculateUsedPercentage,
    removePlant,
    movePlant,
  }) => {
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
              {usedPercentage}%
            </Badge>
          </div>
          <Progress
            value={usedPercentage}
            className="h-2"
            indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
          />
        </div>

        {/* Row Visualization */}
        <div className="relative h-36 rounded-lg overflow-x-auto custom-scrollbar bg-muted/20">
          <div
            className="absolute top-0 left-0 h-full flex items-center"
            style={{ width: `${row.length * 3}px`, minWidth: "100%" }}
          >
            {/* Ruler markings */}
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
                    right: 0,
                    width: `${row.row_ends * 3}px`,
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
                      width: `${(plantInstance.spacing || 0) * 3}px`,
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
                          objectFit="cover"
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
                            onClick={() => removePlant(row.id, plantInstance.id, plantInstance.plant_id)}
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
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if this specific row has changed
    if (prevProps.row.id !== nextProps.row.id) return false
    if (prevProps.row.isActive !== nextProps.row.isActive) return false
    if (prevProps.addingPlantLoading === prevProps.row.id || nextProps.addingPlantLoading === nextProps.row.id)
      return false

    // Check if plants array has changed
    const prevPlants = prevProps.row.plants || []
    const nextPlants = nextProps.row.plants || []

    if (prevPlants.length !== nextPlants.length) return false

    // Check if any plant properties have changed
    for (let i = 0; i < prevPlants.length; i++) {
      if (
        prevPlants[i].id !== nextPlants[i].id ||
        prevPlants[i].position !== nextPlants[i].position ||
        prevPlants[i].animationState !== nextPlants[i].animationState
      ) {
        return false
      }
    }

    // Check other row properties
    if (
      prevProps.row.name !== nextProps.row.name ||
      prevProps.row.length !== nextProps.row.length ||
      prevProps.row.row_ends !== nextProps.row.row_ends
    ) {
      return false
    }

    return true
  },
)

// Update the main component to use the memoized row component
export function GardenRowsContext() {
  const {
    // Rows data and state
    rows,
    viewMode,
    isAddingRow,
    setIsAddingRow,
    addingPlantLoading,
    movingPlant,

    // Row actions
    deleteRow,
    startEditRow,

    // Plant actions
    setAddingPlantToRowId,
    setIsAddPlantDialogOpen,
    removePlant,
    movePlant,

    // Calculations
    calculateUsedSpace,
    calculateUsedPercentage,
  } = useGardenContext()

  // Use useMemo to prevent unnecessary recalculations
  const rowsToRender = useMemo(() => {
    return rows.map((row) => (
      <MemoizedRow
        key={row.id}
        row={row}
        addingPlantLoading={addingPlantLoading}
        movingPlant={movingPlant}
        setAddingPlantToRowId={setAddingPlantToRowId}
        setIsAddPlantDialogOpen={setIsAddPlantDialogOpen}
        startEditRow={startEditRow}
        deleteRow={deleteRow}
        calculateUsedSpace={calculateUsedSpace}
        calculateUsedPercentage={calculateUsedPercentage}
        removePlant={removePlant}
        movePlant={movePlant}
      />
    ))
  }, [rows, addingPlantLoading, movingPlant])

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
          <div className="space-y-3">{rowsToRender}</div>
        ) : (
          // Grid View - Similar optimization can be applied here
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
