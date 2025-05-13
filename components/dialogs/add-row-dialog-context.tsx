"use client"

import { Info } from "lucide-react"
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
import { useGardenContext } from "@/context/GardenContext"

export function AddRowDialogContext() {
  const {
    isAddingRow,
    setIsAddingRow,
    newRowName,
    setNewRowName,
    newRowLength,
    setNewRowLength,
    newRowEnds,
    setNewRowEnds,
    addRow,
  } = useGardenContext()

  console.log("AddRowDialogContext rendered, isAddingRow:", isAddingRow)

  return (
    <Dialog open={isAddingRow} onOpenChange={setIsAddingRow}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Garden Row</DialogTitle>
          <DialogDescription>Create a new row in your garden for planting.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="row-name">Row Name</Label>
            <Input
              id="row-name"
              value={newRowName}
              onChange={(e) => setNewRowName(e.target.value)}
              placeholder="e.g., Tulip Row"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="row-length">Row Length (cm)</Label>
              <span className="text-sm text-muted-foreground">{(newRowLength / 100).toFixed(1)} m</span>
            </div>
            <Input
              id="row-length"
              type="number"
              min="30"
              max="2000"
              value={newRowLength}
              onChange={(e) => setNewRowLength(Number(e.target.value))}
              onClick={(e) => e.currentTarget.select()}
              placeholder="e.g., 240"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="row-ends">Row Ends</Label>
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
              id="row-ends"
              type="number"
              min="0"
              value={newRowEnds}
              onChange={(e) => setNewRowEnds(Number(e.target.value))}
              onClick={(e) => e.currentTarget.select()}
              placeholder="e.g., 10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddingRow(false)}>
            Cancel
          </Button>
          <Button onClick={addRow} className="bg-primary hover:bg-primary/90">
            Add Row
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
