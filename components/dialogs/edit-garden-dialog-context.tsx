"use client"

import { Save } from "lucide-react"
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
import { useGardenContext } from "@/context/garden-context"

export function EditGardenDialogContext() {
  const { editingGarden, setEditingGarden, saveGardenEdit } = useGardenContext()

  if (!editingGarden) return null

  return (
    <Dialog open={!!editingGarden} onOpenChange={(open) => !open && setEditingGarden(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Garden</DialogTitle>
          <DialogDescription>Update the name of your garden.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-garden-name">Garden Name</Label>
            <Input
              id="edit-garden-name"
              value={editingGarden.name}
              onChange={(e) => setEditingGarden({ ...editingGarden, name: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingGarden(null)}>
            Cancel
          </Button>
          <Button onClick={saveGardenEdit} className="bg-primary hover:bg-primary/90">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
