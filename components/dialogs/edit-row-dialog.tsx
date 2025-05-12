"use client"

import { Save, Info } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: any[]
  isActive?: boolean
}

interface EditRowDialogProps {
  editingRow: GardenRow | null
  setEditingRow: (row: GardenRow | null) => void
  saveRowEdit: () => Promise<void>
}

export function EditRowDialog({ editingRow, setEditingRow, saveRowEdit }: EditRowDialogProps) {
  if (!editingRow) return null

  return (
    <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Row</DialogTitle>
          <DialogDescription>Update the details of your garden row.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-row-name">Row Name</Label>
            <Input
              id="edit-row-name"
              value={editingRow.name}
              onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="edit-row-length">Row Length (cm)</Label>
              <span className="text-sm text-muted-foreground">{(editingRow.length / 100).toFixed(1)} m</span>
            </div>
            <Input
              id="edit-row-length"
              type="number"
              min="30"
              max="2000"
              value={editingRow.length}
              onChange={(e) => setEditingRow({ ...editingRow, length: Number(e.target.value) })}
              onClick={(e) => e.currentTarget.select()}
              placeholder="e.g., 240"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="edit-row-ends">Row Ends</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Space from the edge to the first/last plant in the row</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="edit-row-ends"
              type="number"
              min="0"
              value={editingRow.row_ends || 0}
              onChange={(e) => setEditingRow({ ...editingRow, row_ends: Number(e.target.value) })}
              placeholder="e.g., 10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingRow(null)}>
            Cancel
          </Button>
          <Button onClick={saveRowEdit} className="bg-primary hover:bg-primary/90">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
