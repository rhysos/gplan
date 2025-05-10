"use client"

import { useState } from "react"
import type { GardenRow } from "@/types"
import { RowHeader } from "./row-header"
import { RowProgress } from "./row-progress"
import { RowVisualization } from "./row-visualization"
import { RowForm } from "./row-form"
import { calculateUsedSpace, calculateUsedPercentage } from "@/utils/garden-utils"

interface RowCardProps {
  row: GardenRow
  onUpdateRow: (rowId: number, name: string, length: number, rowEnds: number) => Promise<GardenRow | null>
  onDeleteRow: (rowId: number) => Promise<boolean>
  onAddPlant: (rowId: number) => void
  onRemovePlant: (rowId: number, plantInstanceId: number, plantId: number) => void
  onMovePlant: (rowId: number, plantIndex: number, direction: "left" | "right") => void
  isAddingPlant: boolean
  isMovingPlant: boolean
}

export function RowCard({
  row,
  onUpdateRow,
  onDeleteRow,
  onAddPlant,
  onRemovePlant,
  onMovePlant,
  isAddingPlant,
  isMovingPlant,
}: RowCardProps) {
  const [isEditingRow, setIsEditingRow] = useState(false)

  const usedSpace = calculateUsedSpace(row)
  const usedPercentage = calculateUsedPercentage(row)
  const isNearlyFull = usedPercentage > 90

  const handleUpdateRow = async (name: string, length: number, rowEnds: number) => {
    const result = await onUpdateRow(row.id, name, length, rowEnds)
    if (result) {
      setIsEditingRow(false)
    }
    return result
  }

  return (
    <div className={`garden-row p-3 ${row.isActive ? "ring-2 ring-primary" : ""}`} data-active={row.isActive}>
      <RowHeader
        row={row}
        usedSpace={usedSpace}
        onAddPlant={() => onAddPlant(row.id)}
        onEditRow={() => setIsEditingRow(true)}
        onDeleteRow={() => onDeleteRow(row.id)}
        isAddingPlant={isAddingPlant && row.isActive}
      />

      <RowProgress usedPercentage={usedPercentage} isNearlyFull={isNearlyFull} />

      <RowVisualization
        row={row}
        onRemovePlant={(plantInstanceId, plantId) => onRemovePlant(row.id, plantInstanceId, plantId)}
        onMovePlant={(plantIndex, direction) => onMovePlant(row.id, plantIndex, direction)}
        isMovingPlant={isMovingPlant}
      />

      <RowForm
        isOpen={isEditingRow}
        onOpenChange={setIsEditingRow}
        onSubmit={handleUpdateRow}
        initialValues={row}
        title="Edit Row"
        description="Update the details of your garden row."
        submitLabel="Save Changes"
      />
    </div>
  )
}
