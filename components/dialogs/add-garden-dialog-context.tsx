"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useGardenContext } from "@/context/GardenContext"

export function AddGardenDialogContext() {
  const { isAddingGarden, setIsAddingGarden, newGardenName, setNewGardenName, addGarden } = useGardenContext()

  console.log("AddGardenDialogContext rendered, isAddingGarden:", isAddingGarden)

  return (
    <Dialog open={isAddingGarden} onOpenChange={setIsAddingGarden}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Garden</DialogTitle>
          <DialogDescription>Give your garden a name to help you organize your planting plans.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="garden-name">Garden Name</Label>
            <Input
              id="garden-name"
              value={newGardenName}
              onChange={(e) => setNewGardenName(e.target.value)}
              placeholder="e.g., Backyard Garden"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddingGarden(false)}>
            Cancel
          </Button>
          <Button onClick={addGarden} className="bg-primary hover:bg-primary/90">
            Create Garden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
