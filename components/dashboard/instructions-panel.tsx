"use client"

import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InstructionsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrls?: {
    gardenSelect?: string
    rowManagement?: string
    flowerManagement?: string
    planting?: string
  }
}

export function InstructionsPanel({
  open,
  onOpenChange,
  imageUrls = {
    // Default placeholder URLs - replace these with your actual URLs when provided
    gardenSelect: "/garden-selection-interface.png",
    rowManagement: "/garden-row-management.png",
    flowerManagement: "/flower-management-interface.png",
    planting: "/placeholder.svg?key=9mu6d",
  },
}: InstructionsPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span>Garden Planner Instructions</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="getting-started" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="gardens">Gardens</TabsTrigger>
            <TabsTrigger value="rows">Rows</TabsTrigger>
            <TabsTrigger value="flowers">Flowers</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
            <TabsContent value="getting-started" className="mt-0">
              <div className="space-y-4">
                <p className="text-sm">
                  Welcome to the Garden Planner! This tool helps you plan and visualize your garden layout. Here's how
                  to get started:
                </p>

                <div className="rounded-md overflow-hidden border">
                  <CloudinaryImage
                    src={imageUrls.gardenSelect}
                    alt="Garden selection interface"
                    width={700}
                    height={350}
                    className="w-full"
                  />
                </div>

                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Create a Garden by clicking the "Add Garden" button in the dropdown menu</li>
                  <li>Add Rows to your garden with the "Add Row" button</li>
                  <li>Manage your Flower inventory in the "Flowers" tab</li>
                  <li>Add Flowers to your rows by clicking the "+" button in each row</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="gardens" className="mt-0">
              <div className="space-y-4">
                <p className="text-sm">
                  Gardens are the top-level organization in the planner. You can create multiple gardens for different
                  areas or seasons.
                </p>

                <div className="rounded-md overflow-hidden border">
                  <CloudinaryImage
                    src={imageUrls.gardenSelect}
                    alt="Garden management"
                    width={700}
                    height={350}
                    className="w-full"
                  />
                </div>

                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Click the garden dropdown to switch between gardens</li>
                  <li>Use "Add New Garden" to create a new garden</li>
                  <li>Use "Rename Garden" to change a garden's name</li>
                  <li>Use "Delete Garden" to remove a garden (you must have at least one garden)</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="rows" className="mt-0">
              <div className="space-y-4">
                <p className="text-sm">
                  Rows represent planting areas in your garden. Each row has a length and can contain multiple plants.
                </p>

                <div className="rounded-md overflow-hidden border">
                  <CloudinaryImage
                    src={imageUrls.rowManagement}
                    alt="Row management"
                    width={700}
                    height={350}
                    className="w-full"
                  />
                </div>

                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>A row has a name, length (in cm), and row ends (space at both ends that can't be planted)</li>
                  <li>The progress bar shows how much of the row's space is used</li>
                  <li>You can edit or delete a row using the settings menu</li>
                  <li>The visualization shows how your garden will look with plants placed in rows</li>
                  <li>You can switch between list and grid views using the view controls</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="flowers" className="mt-0">
              <div className="space-y-4">
                <p className="text-sm">
                  Flowers are the plants you'll add to your garden rows. Each flower has specific properties.
                </p>

                <div className="rounded-md overflow-hidden border">
                  <CloudinaryImage
                    src={imageUrls.flowerManagement}
                    alt="Flower management"
                    width={700}
                    height={350}
                    className="w-full"
                  />
                </div>

                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Flowers have a name, image, spacing requirement (in cm), and quantity</li>
                  <li>You can add flowers to your inventory in the Flowers tab</li>
                  <li>To add a flower to a row, click the "Add Plant" button on a row</li>
                  <li>You can add multiple instances of a flower until quantity reaches zero</li>
                  <li>The interface will warn you when a flower doesn't fit in a row</li>
                </ul>

                <div className="rounded-md overflow-hidden border mt-4">
                  <CloudinaryImage
                    src={imageUrls.planting}
                    alt="Planting flowers"
                    width={700}
                    height={350}
                    className="w-full"
                  />
                </div>

                <p className="text-sm">When adding flowers to a row, you can:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Move flowers left or right within a row</li>
                  <li>Remove flowers from a row (which returns them to your inventory)</li>
                  <li>See a visual representation of your garden layout</li>
                </ul>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
