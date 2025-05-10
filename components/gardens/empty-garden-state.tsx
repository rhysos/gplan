"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GardenForm } from "./garden-form"

interface Garden {
  id: number
  name: string
  user_id: number
}

interface EmptyGardenStateProps {
  onCreateGarden: () => void
  gardenFormOpen: boolean
  setGardenFormOpen: (open: boolean) => void
  createGarden: (garden: { name: string }) => Promise<Garden>
}

export function EmptyGardenState({
  onCreateGarden,
  gardenFormOpen,
  setGardenFormOpen,
  createGarden,
}: EmptyGardenStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Welcome to Garden Planner</h2>
          <p className="text-muted-foreground mb-6">Get started by creating your first garden</p>
          <Button onClick={onCreateGarden}>Create Garden</Button>

          <GardenForm open={gardenFormOpen} onOpenChange={setGardenFormOpen} onSubmit={createGarden} gardens={[]} />
        </div>
      </CardContent>
    </Card>
  )
}
