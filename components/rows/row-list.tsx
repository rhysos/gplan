"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GardenRow } from "@/types"
import { RowCard } from "./row-card"
import { RowForm } from "./row-form"
import { EmptyRowState } from "./empty-row-state"

interface RowListProps {
  rows: GardenRow[]
  onAddRow: (name: string, length: number, rowEnds: number) => Promise<GardenRow | null>
  onUpdateRow: (rowId: number, name: string, length: number, rowEnds: number) => Promise<GardenRow | null>
  onDeleteRow: (rowId: number) => Promise<boolean>
  onAddPlant: (rowId: number) => void
  onRemovePlant: (rowId: number, plantInstanceId: number, plantId: number) => void
  onMovePlant: (rowId: number, plantIndex: number, direction: "left" | "right") => void
  isAddingPlant: boolean
  isMovingPlant: boolean
}

export function RowList({
  rows,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onAddPlant,
  onRemovePlant,
  onMovePlant,
  isAddingPlant,
  isMovingPlant,
}: RowListProps) {
  const [isAddingRow, setIsAddingRow] = useState(false)

  const handleAddRow = async (name: string, length: number, rowEnds: number) => {
    const result = await onAddRow(name, length, rowEnds)
    if (result) {
      setIsAddingRow(false)
    }
    return result
  }

  return (
    <>
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

      <div className="space-y-3">
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
      </div>

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
