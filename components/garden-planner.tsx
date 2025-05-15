"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useSession, signOut } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { GardenPlannerHeader } from "@/components/dashboard/garden-planner-header"
import { GardenGrid } from "@/components/dashboard/garden-grid"
import { GardenSidebar } from "@/components/dashboard/garden-sidebar"
import { AddPlantModal } from "@/components/dashboard/add-plant-modal"
import { EditPlantModal } from "@/components/dashboard/edit-plant-modal"
import { AddGardenModal } from "@/components/dashboard/add-garden-modal"
import { EditGardenModal } from "@/components/dashboard/edit-garden-modal"
import { DeleteGardenModal } from "@/components/dashboard/delete-garden-modal"
import { InstructionsModal } from "@/components/dashboard/instructions-modal"
import type { ViewMode } from "@/lib/types"
import { SimplifiedGardenView } from "@/components/dashboard/simplified-garden-view"

const GardenPlanner = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  // Gardens State
  const [gardens, setGardens] = useState<Garden[]>([])
  const [currentGardenId, setCurrentGardenId] = useState<string | null>(null)
  const currentGarden = gardens.find((garden) => garden.id === currentGardenId)

  // Grid State
  const [rows, setRows] = useState<Row[]>([])

  // Modal State
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false)
  const [isEditPlantModalOpen, setIsEditPlantModalOpen] = useState(false)
  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [isEditingGarden, setIsEditingGarden] = useState(false)
  const [isDeletingGarden, setIsDeletingGarden] = useState(false)
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)

  // Plant State
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)

  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Simplified View State
  const [isSimplifiedViewOpen, setIsSimplifiedViewOpen] = useState(false)

  // Toggle Simplified View
  const toggleSimplifiedView = () => {
    setIsSimplifiedViewOpen(!isSimplifiedViewOpen)
  }

  // Fetch Gardens
  useEffect(() => {
    if (session?.user?.email) {
      fetchGardens(session.user.email)
    }
  }, [session])

  // Fetch Rows
  useEffect(() => {
    if (currentGardenId) {
      fetchRows(currentGardenId)
    }
  }, [currentGardenId])

  // Handlers
  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const addPlant = () => {
    setIsAddPlantModalOpen(true)
  }

  const editPlant = (plant: Plant) => {
    setSelectedPlant(plant)
    setIsEditPlantModalOpen(true)
  }

  const deletePlant = async (plantId: string) => {
    if (!currentGardenId) return

    try {
      const response = await fetch(`/api/rows/${currentGardenId}/${plantId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Plant deleted successfully.",
        })
        fetchRows(currentGardenId) // Refresh rows after deletion
      } else {
        toast({
          title: "Error",
          description: "Failed to delete plant.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting plant:", error)
      toast({
        title: "Error",
        description: "Failed to delete plant.",
        variant: "destructive",
      })
    }
  }

  const startEditGarden = () => {
    setIsEditingGarden(true)
  }

  const deleteGarden = () => {
    setIsDeletingGarden(true)
  }

  // API Calls
  const fetchGardens = async (email: string) => {
    try {
      const response = await fetch(`/api/gardens?email=${email}`)
      if (response.ok) {
        const data = await response.json()
        setGardens(data)
        if (data.length > 0 && !currentGardenId) {
          setCurrentGardenId(data[0].id)
        }
      } else {
        console.error("Failed to fetch gardens")
      }
    } catch (error) {
      console.error("Error fetching gardens:", error)
    }
  }

  const fetchRows = async (gardenId: string) => {
    try {
      const response = await fetch(`/api/rows?gardenId=${gardenId}`)
      if (response.ok) {
        const data = await response.json()
        setRows(data)
      } else {
        console.error("Failed to fetch rows")
      }
    } catch (error) {
      console.error("Error fetching rows:", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Header */}
      <GardenPlannerHeader
        gardens={gardens}
        currentGardenId={currentGardenId}
        setCurrentGardenId={setCurrentGardenId}
        currentGardenName={currentGarden?.name || "Select Garden"}
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
        toggleSimplifiedView={toggleSimplifiedView}
      />

      {/* Sidebar */}
      <GardenSidebar
        addPlant={addPlant}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 p-4">
        {viewMode === "grid" && <GardenGrid rows={rows} editPlant={editPlant} deletePlant={deletePlant} />}
        {viewMode === "list" && <div>List View Content</div>}
      </div>

      {/* Modals */}
      <AddPlantModal
        isOpen={isAddPlantModalOpen}
        onClose={() => setIsAddPlantModalOpen(false)}
        gardenId={currentGardenId}
        fetchRows={fetchRows}
      />
      <EditPlantModal
        isOpen={isEditPlantModalOpen}
        onClose={() => setIsEditPlantModalOpen(false)}
        plant={selectedPlant}
        gardenId={currentGardenId}
        fetchRows={fetchRows}
      />
      <AddGardenModal isOpen={isAddingGarden} onClose={() => setIsAddingGarden(false)} fetchGardens={fetchGardens} />
      <EditGardenModal
        isOpen={isEditingGarden}
        onClose={() => setIsEditingGarden(false)}
        garden={currentGarden}
        fetchGardens={fetchGardens}
      />
      <DeleteGardenModal
        isOpen={isDeletingGarden}
        onClose={() => setIsDeletingGarden(false)}
        gardenId={currentGardenId}
        gardenName={currentGarden?.name || ""}
        fetchGardens={fetchGardens}
        setCurrentGardenId={setCurrentGardenId}
      />
      <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />

      {/* Simplified Garden View */}
      <SimplifiedGardenView
        isOpen={isSimplifiedViewOpen}
        onClose={() => setIsSimplifiedViewOpen(false)}
        rows={rows}
        gardenName={currentGarden?.name || "Garden"}
      />
    </div>
  )
}

export default GardenPlanner
