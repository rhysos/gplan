"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, List, Grid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import our new modular components
import { GardenSelector } from "@/components/gardens/garden-selector"
import { GardenForm } from "@/components/gardens/garden-form"
import { EmptyGardenState } from "@/components/gardens/empty-garden-state"
import { RowForm } from "@/components/rows/row-form"
import { RowList } from "@/components/rows/row-list"
import { RowGrid } from "@/components/rows/row-grid"
import { LoadingSpinner } from "@/components/layout/loading-spinner"

// Import our custom hooks
import { useGardens } from "@/hooks/use-gardens"
import { useRows } from "@/hooks/use-rows"
import { usePlants } from "@/hooks/use-plants"

export function GardenPlanner() {
  const { toast } = useToast()
  const [gardenFormOpen, setGardenFormOpen] = useState(false)
  const [rowFormOpen, setRowFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Use our custom hooks
  const { gardens, selectedGarden, setSelectedGarden, isLoadingGardens, createGarden, updateGarden, deleteGarden } =
    useGardens()

  const { rows, isLoadingRows, createRow, updateRow, deleteRow, moveRowUp, moveRowDown } = useRows(selectedGarden?.id)

  const { plants, isLoadingPlants, usageCounts, addPlantToRow, removePlantFromRow, movePlantLeft, movePlantRight } =
    usePlants()

  // Show error toast if any data fails to load
  useEffect(() => {
    if (gardens === null || rows === null || plants === null) {
      toast({
        title: "Error loading data",
        description: "There was a problem loading your garden data. Please try again.",
        variant: "destructive",
      })
    }
  }, [gardens, rows, plants, toast])

  // Loading state
  if (isLoadingGardens || isLoadingRows || isLoadingPlants) {
    return <LoadingSpinner />
  }

  // Error state
  if (gardens === null || rows === null || plants === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load garden data</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state - no gardens
  if (gardens.length === 0) {
    return (
      <EmptyGardenState
        onCreateGarden={() => setGardenFormOpen(true)}
        gardenFormOpen={gardenFormOpen}
        setGardenFormOpen={setGardenFormOpen}
        createGarden={createGarden}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Garden selector and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <GardenSelector gardens={gardens} selectedGarden={selectedGarden} setSelectedGarden={setSelectedGarden} />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setGardenFormOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Garden</span>
          </Button>

          {/* View mode toggle */}
          <div className="border rounded-md p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Garden form dialog */}
      <GardenForm open={gardenFormOpen} onOpenChange={setGardenFormOpen} onSubmit={createGarden} gardens={gardens} />

      {/* Main content */}
      {selectedGarden && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">{selectedGarden.name}</CardTitle>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setRowFormOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Row</span>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Row form dialog */}
            <RowForm
              open={rowFormOpen}
              onOpenChange={setRowFormOpen}
              onSubmit={createRow}
              gardenId={selectedGarden.id}
            />

            {/* Rows display */}
            {rows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No rows in this garden yet</p>
                <Button onClick={() => setRowFormOpen(true)}>Add Your First Row</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === "list" ? (
                  <RowList
                    rows={rows}
                    plants={plants}
                    usageCounts={usageCounts}
                    onUpdateRow={updateRow}
                    onDeleteRow={deleteRow}
                    onMoveRowUp={moveRowUp}
                    onMoveRowDown={moveRowDown}
                    onAddPlant={addPlantToRow}
                    onRemovePlant={removePlantFromRow}
                    onMovePlantLeft={movePlantLeft}
                    onMovePlantRight={movePlantRight}
                  />
                ) : (
                  <RowGrid
                    rows={rows}
                    plants={plants}
                    usageCounts={usageCounts}
                    onUpdateRow={updateRow}
                    onDeleteRow={deleteRow}
                    onMoveRowUp={moveRowUp}
                    onMoveRowDown={moveRowDown}
                    onAddPlant={addPlantToRow}
                    onRemovePlant={removePlantFromRow}
                    onMovePlantLeft={movePlantLeft}
                    onMovePlantRight={movePlantRight}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
