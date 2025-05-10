"use client"

import { Home, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyGardenStateProps {
  onAddGarden: () => void
}

export function EmptyGardenState({ onAddGarden }: EmptyGardenStateProps) {
  return (
    <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl bg-muted/20">
      <div className="max-w-md mx-auto">
        <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Home size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Gardens Yet</h2>
        <p className="text-muted-foreground mb-6">Create your first garden to start planning your rows and plants.</p>
        <Button onClick={onAddGarden} className="bg-primary hover:bg-primary/90" size="lg">
          <Plus size={18} className="mr-2" />
          Create Your First Garden
        </Button>
      </div>
    </div>
  )
}
