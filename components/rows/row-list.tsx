"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react"
import { RowForm } from "./row-form"
import { PlantSelector } from "../plants/plant-selector"
import { PlantList } from "../plants/plant-list"
import { RowProgress } from "./row-progress"
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

interface RowListProps {
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
  isAddingPlant: boolean
  isMovingPlant: boolean
}

export function RowList({
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
  isAddingPlant,
  isMovingPlant,
}: RowListProps) {
  const [editingRow, setEditingRow] = useState<Row | null>(null)
  const [addingPlantsToRow, setAddingPlantsToRow] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingRow, setIsAddingRow] = useState(false)

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

  const handleAddRow = async (name: string, length: number, rowEnds: number) => {
    const result = await onUpdateRow(0, { name, length, row_ends: rowEnds })
    if (result) {
      setIsAddingRow(false)
    }
    return result
  }

  return (
    <>
      <div className="space-y-4">
        {rows.map((row) => {
          const usedSpace = calculateUsedSpace(row)
          const usedPercentage = calculateUsedPercentage(row)

          return (
            <Card key={row.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{row.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{row.length} mm length</span>
                        <span>•</span>
                        <span>{usedSpace} mm used</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onMoveRowUp(row.id)}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onMoveRowDown(row.id)}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRow(row)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <RowProgress usedPercentage={usedPercentage} className="mt-2" />
                </div>

                <div className="p-4">
                  <PlantList
                    rowId={row.id}
                    onRemovePlant={onRemovePlant}
                    onMovePlantLeft={onMovePlantLeft}
                    onMovePlantRight={onMovePlantRight}
                  />

                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setAddingPlantsToRow(row.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plant
                  </Button>
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
      <div className="mb-3">
        <div className="flex items-center">
          <p className="text-muted-foreground flex items-center text-sm">
            <span className="font-semibold">{rows.length}</span>&nbsp;
            <span className="font-medium">Rows</span>
            <Button
              variant="outline"
              size="icon"
              className="ml-2 h-7 w-7 border-primary hover:bg-primary/10"
              onClick={() => setIsAddingRow(true)}
            >
              <Plus size={14} className="text-primary" />
            </Button>
          </p>
        </div>
      </div>

      {/*<div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyRowState onAddRow={() => setIsAddingRow(true)} />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <RowCard
                key={row.id}
                row={row}
                onUpdateRow={onUpdateRow}
                onDeleteRow={onDeleteRow}
                onAddPlant={onAddPlant}
                onRemovePlant={onRemovePlant}
                onMovePlant={onMovePlant}
                isAddingPlant={isAddingPlant}
                isMovingPlant={isMovingPlant}
              />
            ))}
          </div>
        )}
      </div>*/}

      <RowForm
        isOpen={isAddingRow}
        onOpenChange={setIsAddingRow}
        onSubmit={handleAddRow}
        title="Add New Garden Row"
        description="Create a new row in your garden for planting."
        submitLabel="Add Row"
      />
    </>
  )
}
