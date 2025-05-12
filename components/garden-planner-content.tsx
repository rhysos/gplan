"use client"

import { useGardenContext } from "@/context/GardenContext"
import { InstructionsPanel } from "@/components/dashboard/instructions-panel"
import { GardenPlannerHeader } from "@/components/garden-planner-header"
import { GardenRows } from "@/components/garden-rows"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import dialog components
import { AddGardenDialog } from "@/components/dialogs/add-garden-dialog"
import { EditGardenDialog } from "@/components/dialogs/edit-garden-dialog"
import { AddRowDialog } from "@/components/dialogs/add-row-dialog"
import { EditRowDialog } from "@/components/dialogs/edit-row-dialog"
import { AddPlantDialog } from "@/components/dialogs/add-plant-dialog"

// Content component that uses the context
export function GardenPlannerContent() {
  const {
    // Gardens
    gardens,
    currentGardenId,
    setCurrentGardenId,
    currentGardenName,
    gardensLoading,
    isAddingGarden,
    setIsAddingGarden,
    newGardenName,
    setNewGardenName,
    editingGarden,
    setEditingGarden,
    addGarden,
    deleteGarden,
    startEditGarden,
    saveGardenEdit,

    // Plants
    plants,
    usageCounts,

    // Rows
    rows,
    rowsLoading,
    isAddingRow,
    setIsAddingRow,
    newRowName,
    setNewRowName,
    newRowLength,
    setNewRowLength,
    newRowEnds,
    setNewRowEnds,
    editingRow,
    setEditingRow,
    addingPlantLoading,
    selectedPlant,
    setSelectedPlant,
    addingPlantToRowId,
    setAddingPlantToRowId,
    isAddPlantDialogOpen,
    setIsAddPlantDialogOpen,
    addRow,
    deleteRow,
    startEditRow,
    saveRowEdit,
    calculateUsedSpace,
    calculateUsedPercentage,
    wouldPlantFit,
    addPlantToRow,
    removePlant,
    movePlant,
    movingPlant,

    // UI state
    viewMode,
    setViewMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isInstructionsOpen,
    setIsInstructionsOpen,

    // Auth
    handleLogout,
  } = useGardenContext()

  // Show loading spinner while data is being fetched
  if (gardensLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading your gardens...</p>
        </div>
      </div>
    )
  }

  // Handle adding a plant to a row
  const handleAddPlantToRow = () => {
    if (selectedPlant && addingPlantToRowId) {
      const plant = plants.find((p) => p.id === selectedPlant)
      if (plant) {
        addPlantToRow(addingPlantToRowId, plant)
      }
    }
  }

  // Main component render
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Garden Planner Header */}
      <GardenPlannerHeader
        gardens={gardens}
        currentGardenId={currentGardenId}
        setCurrentGardenId={setCurrentGardenId}
        currentGardenName={currentGardenName}
        isAddingGarden={isAddingGarden}
        setIsAddingGarden={setIsAddingGarden}
        startEditGarden={startEditGarden}
        deleteGarden={deleteGarden}
        handleLogout={handleLogout}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isInstructionsOpen={isInstructionsOpen}
        setIsInstructionsOpen={setIsInstructionsOpen}
      />

      {/* Add Garden Dialog */}
      <AddGardenDialog
        open={isAddingGarden}
        onOpenChange={setIsAddingGarden}
        newGardenName={newGardenName}
        setNewGardenName={setNewGardenName}
        addGarden={addGarden}
      />

      {/* Edit Garden Dialog */}
      <EditGardenDialog
        editingGarden={editingGarden}
        setEditingGarden={setEditingGarden}
        saveGardenEdit={saveGardenEdit}
      />

      {/* No Gardens State */}
      {gardens.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl bg-muted/20">
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Home size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Gardens Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first garden to start planning your rows and plants.
            </p>
            <Button onClick={() => setIsAddingGarden(true)} className="bg-primary hover:bg-primary/90" size="lg">
              Create Your First Garden
            </Button>
          </div>
        </div>
      ) : (
        <GardenRows
          rows={rows}
          viewMode={viewMode}
          isAddingRow={isAddingRow}
          setIsAddingRow={setIsAddingRow}
          newRowName={newRowName}
          setNewRowName={setNewRowName}
          newRowLength={newRowLength}
          setNewRowLength={setNewRowLength}
          newRowEnds={newRowEnds}
          setNewRowEnds={setNewRowEnds}
          addRow={addRow}
          deleteRow={deleteRow}
          startEditRow={startEditRow}
          addingPlantLoading={addingPlantLoading}
          setAddingPlantToRowId={setAddingPlantToRowId}
          setIsAddPlantDialogOpen={setIsAddPlantDialogOpen}
          calculateUsedSpace={calculateUsedSpace}
          calculateUsedPercentage={calculateUsedPercentage}
          removePlant={removePlant}
          movePlant={movePlant}
          movingPlant={movingPlant}
        />
      )}

      {/* Add Row Dialog */}
      <AddRowDialog
        open={isAddingRow}
        onOpenChange={setIsAddingRow}
        newRowName={newRowName}
        setNewRowName={setNewRowName}
        newRowLength={newRowLength}
        setNewRowLength={setNewRowLength}
        newRowEnds={newRowEnds}
        setNewRowEnds={setNewRowEnds}
        addRow={addRow}
      />

      {/* Edit Row Dialog */}
      <EditRowDialog editingRow={editingRow} setEditingRow={setEditingRow} saveRowEdit={saveRowEdit} />

      {/* Add Plant Dialog */}
      <AddPlantDialog
        open={isAddPlantDialogOpen}
        onOpenChange={setIsAddPlantDialogOpen}
        plants={plants}
        rows={rows}
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        addingPlantToRowId={addingPlantToRowId}
        setAddingPlantToRowId={setAddingPlantToRowId}
        addingPlantLoading={addingPlantLoading}
        usageCounts={usageCounts}
        wouldPlantFit={wouldPlantFit}
        addPlantToRow={handleAddPlantToRow}
      />

      {/* Instructions Modal */}
      <InstructionsPanel open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen} />
    </div>
  )
}
