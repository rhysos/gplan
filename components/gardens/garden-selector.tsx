"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Garden {
  id: number
  name: string
  user_id: number
}

interface GardenSelectorProps {
  gardens: Garden[]
  selectedGarden: Garden | null
  setSelectedGarden: (garden: Garden) => void
}

export function GardenSelector({ gardens, selectedGarden, setSelectedGarden }: GardenSelectorProps) {
  return (
    <Select
      value={selectedGarden?.id.toString() || ""}
      onValueChange={(value) => {
        const garden = gardens.find((g) => g.id.toString() === value)
        if (garden) {
          setSelectedGarden(garden)
        }
      }}
    >
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Select a garden" />
      </SelectTrigger>
      <SelectContent>
        {gardens.map((garden) => (
          <SelectItem key={garden.id} value={garden.id.toString()}>
            {garden.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
