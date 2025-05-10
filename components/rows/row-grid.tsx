"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Flower } from "lucide-react"
import { RowForm } from "./row-form"
import { PlantSelector } from "../plants/plant-selector"
import { RowProgress } from "./row-progress"
import { PlantPreview } from "../plants/plant-preview"
import { calculateUsedSpace, calculateUsedPercentage } from "@/utils/garden-utils"

interface Row {
  id: number
  garden_id: number
  name: string
  length: number
  position: number
  row_ends?: number
}

interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity: number
}

interface RowGridProps {
  rows: Row[]
  plants: Plant[]
  usageCounts: Record<number, number>
  onUpdateRow: (id: number, row: { name: string; length: number; row_ends?: number }) => Promise<any>
  onDeleteRow: (id: number) => Promise<void>
  onMoveRowUp: (id: number) => Promise<void>
  onMoveRowDown: (id: number) => Promise<void>
  onAddPlant: (rowId: number, plantId: number, position: number) => Promise<any>
  onRemovePlant: (plantInstanceId: number, plantId: number) => Promise<void>
  onMovePlantLeft: (plantInstanceId: number) => Promise<void>
  onMovePlantRight: (plantInstanceId: number) => Promise<void>
}

export function RowGrid({
  rows,
  plants,
  usageCounts,
  onUpdateRow,
  onDeleteRow,
  onMoveRowUp,
  onMoveRowDown,
  onAddPlant,
  onRemovePlant,
  onMovePlantLeft,
  onMovePlantRight,
}: RowGridProps) {
  const [editingRow, setEditingRow] = useState<Row | null>(null)
  const [addingPlantsToRow, setAddingPlantsToRow] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditRow = (row: Row) => {
    setEditingRow(row)
  }

  const handleUpdateRow = async (row: { name: string; length: number; row_ends?: number }) => {
    if (!editingRow) return null

    setIsSubmitting(true)
    try {
      const result = await onUpdateRow(editingRow.id, row)
      setEditingRow(null)
      return result
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRow = async (id: number) => {
    if (confirm("Are you sure you want to delete this row? This action cannot be undone.")) {
      await onDeleteRow(id)
    }
  }

  const handleAddPlant = async (rowId: number, plantId: number) => {
    // Calculate position based on existing plants
    const position = 0 // This would be calculated based on existing plants
    await onAddPlant(rowId, plantId, position)
    setAddingPlantsToRow(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((row) => {
        const usedSpace = calculateUsedSpace(row)
        const usedPercentage = calculateUsedPercentage(row)

        return (
          <Card key={row.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{row.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddingPlantsToRow(row.id)}>
                    <Flower className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRow(row)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteRow(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              {/* Row Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-xs text-muted-foreground">Length</p>
                  <p className="font-medium">{row.length} mm</p>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="font-medium">{usedSpace} mm</p>
                </div>
                <div className="bg-muted/30 rounded-md p-2 text-center">
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="font-medium">{usedPercentage}%</p>
                </div>
              </div>

              <RowProgress usedPercentage={usedPercentage} />

              {/* Plant Preview */}
              <div className="mt-3">
                <PlantPreview rowId={row.id} />
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Edit Row Dialog */}
      {editingRow && (
        <RowForm
          open={!!editingRow}
          onOpenChange={(open) => !open && setEditingRow(null)}
          onSubmit={handleUpdateRow}
          gardenId={editingRow.garden_id}
          initialRow={editingRow}
        />
      )}

      {/* Add Plant Dialog */}
      {addingPlantsToRow && (
        <PlantSelector
          open={!!addingPlantsToRow}
          onOpenChange={(open) => !open && setAddingPlantsToRow(null)}
          plants={plants}
          usageCounts={usageCounts}
          onSelectPlant={(plantId) => handleAddPlant(addingPlantsToRow, plantId)}
          rowId={addingPlantsToRow}
          rows={rows}
        />
      )}
    </div>
  )
}
