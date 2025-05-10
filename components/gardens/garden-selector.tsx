"use client"

import { useState } from "react"
import { Home, ChevronDown, Plus, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Garden } from "@/types"
import { GardenForm } from "./garden-form"

interface GardenSelectorProps {
  gardens: Garden[]
  currentGardenId: number | null
  onSelectGarden: (gardenId: number) => void
  onAddGarden: (name: string) => Promise<Garden | null>
  onUpdateGarden: (gardenId: number, name: string) => Promise<Garden | null>
  onDeleteGarden: (gardenId: number) => Promise<boolean>
}

export function GardenSelector({
  gardens,
  currentGardenId,
  onSelectGarden,
  onAddGarden,
  onUpdateGarden,
  onDeleteGarden,
}: GardenSelectorProps) {
  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null)

  const currentGardenName = gardens.find((g) => g.id === currentGardenId)?.name || "Select Garden"

  const handleAddGarden = async (name: string) => {
    const garden = await onAddGarden(name)
    if (garden) {
      setIsAddingGarden(false)
    }
    return garden
  }

  const handleUpdateGarden = async (name: string) => {
    if (!editingGarden) return null

    const garden = await onUpdateGarden(editingGarden.id, name)
    if (garden) {
      setEditingGarden(null)
    }
    return garden
  }

  const handleDeleteGarden = async (gardenId: number) => {
    return await onDeleteGarden(gardenId)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all text-xs"
          >
            <Home size={14} className="text-primary" />
            <span className="font-medium">{currentGardenName}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {gardens.map((garden) => (
            <DropdownMenuItem
              key={garden.id}
              onClick={() => onSelectGarden(garden.id)}
              className={garden.id === currentGardenId ? "bg-primary/10 text-primary font-medium" : ""}
            >
              {garden.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAddingGarden(true)} className="text-primary">
            <Plus size={16} className="mr-2" />
            Add New Garden
          </DropdownMenuItem>
          {currentGardenId && gardens.length > 1 && (
            <DropdownMenuItem onClick={() => handleDeleteGarden(currentGardenId)} className="text-destructive">
              <Trash2 size={16} className="mr-2" />
              Delete {currentGardenName}
            </DropdownMenuItem>
          )}
          {currentGardenId && (
            <DropdownMenuItem onClick={() => setEditingGarden(gardens.find((g) => g.id === currentGardenId)!)}>
              <Edit size={16} className="mr-2" />
              Rename Garden
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <GardenForm
        isOpen={isAddingGarden}
        onOpenChange={setIsAddingGarden}
        onSubmit={handleAddGarden}
        title="Create New Garden"
        description="Give your garden a name to help you organize your planting plans."
        submitLabel="Create Garden"
      />

      {editingGarden && (
        <GardenForm
          isOpen={!!editingGarden}
          onOpenChange={(open) => !open && setEditingGarden(null)}
          onSubmit={handleUpdateGarden}
          initialValue={editingGarden.name}
          title="Rename Garden"
          description="Update the name of your garden."
          submitLabel="Save Changes"
        />
      )}
    </>
  )
}
