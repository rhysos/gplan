"use client"

import { useGardenContext } from "@/context/GardenContext"
import { InstructionsPanel } from "@/components/dashboard/instructions-panel"
import { GardenPlannerHeaderContext } from "@/components/garden-planner-header-context"
import { GardenRowsContext } from "@/components/garden-rows-context"
import { Home, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import dialog components
import { AddGardenDialogContext } from "@/components/dialogs/add-garden-dialog-context"
import { EditGardenDialogContext } from "@/components/dialogs/edit-garden-dialog-context"
import { AddRowDialogContext } from "@/components/dialogs/add-row-dialog-context"
import { EditRowDialogContext } from "@/components/dialogs/edit-row-dialog-context"
import { AddPlantDialogContext } from "@/components/dialogs/add-plant-dialog-context"

// Content component that uses the context
export function GardenPlannerContent() {
  const {
    // Gardens
    gardens,
    gardensLoading,
    isAddingGarden,
    setIsAddingGarden,

    // UI state
    isInstructionsOpen,
    setIsInstructionsOpen,
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

  // Main component render
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Garden Planner Header - Using context version */}
      <GardenPlannerHeaderContext />

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
              <Plus size={18} className="mr-2" />
              Create Your First Garden
            </Button>
          </div>
        </div>
      ) : (
        <GardenRowsContext />
      )}

      {/* Dialog Components - Using context versions */}
      <AddGardenDialogContext />
      <EditGardenDialogContext />
      <AddRowDialogContext />
      <EditRowDialogContext />
      <AddPlantDialogContext />

      {/* Instructions Modal */}
      <InstructionsPanel open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen} />
    </div>
  )
}
