"use client"

import { Ruler, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyRowStateProps {
  onAddRow: () => void
}

export function EmptyRowState({ onAddRow }: EmptyRowStateProps) {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
      <div className="max-w-md mx-auto">
        <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Ruler size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Rows Yet</h2>
        <p className="text-muted-foreground mb-6">Add your first row to start planning your garden layout.</p>
        <Button onClick={onAddRow} className="bg-primary hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          Add Your First Row
        </Button>
      </div>
    </div>
  )
}
