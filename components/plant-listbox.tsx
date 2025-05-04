"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

interface PlantListboxProps {
  plants: Plant[]
  selectedPlantId: number | null
  onSelectPlant: (plantId: number) => void
}

export function PlantListbox({ plants, selectedPlantId, onSelectPlant }: PlantListboxProps) {
  const [open, setOpen] = useState(false)
  const selectedPlant = plants.find((plant) => plant.id === selectedPlantId)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonWidth, setButtonWidth] = useState<number>(0)

  // Update the button width when it changes
  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth)
    }
  }, [buttonRef.current?.offsetWidth])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPlant ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                <CloudinaryImage
                  src={selectedPlant.image_url}
                  alt={selectedPlant.name}
                  width={24}
                  height={24}
                  className="w-full h-full"
                />
              </div>
              <span className="truncate">{selectedPlant.name}</span>
            </div>
          ) : (
            "Select a flower..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: Math.max(buttonWidth, 300) }}>
        <Command>
          <CommandInput placeholder="Search flowers..." />
          <CommandList>
            <CommandEmpty>No flowers found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {plants.map((plant) => {
                const quantity = plant.quantity || 10 // Default to 10 if not set
                const usedCount = plant.used_count || 0
                const available = quantity - usedCount

                return (
                  <CommandItem
                    key={plant.id}
                    value={plant.name}
                    onSelect={() => {
                      onSelectPlant(plant.id)
                      setOpen(false)
                    }}
                    disabled={available <= 0}
                    className={cn("flex items-center gap-2 py-2", available <= 0 && "opacity-50 cursor-not-allowed")}
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <CloudinaryImage
                        src={plant.image_url}
                        alt={plant.name}
                        width={32}
                        height={32}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">{plant.name}</span>
                        <Badge variant={available > 0 ? "outline" : "destructive"} className="ml-2">
                          {available} left
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Spacing: {plant.spacing} cm</div>
                    </div>
                    <Check
                      className={cn("ml-auto h-4 w-4", selectedPlantId === plant.id ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
