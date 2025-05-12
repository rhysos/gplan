"use client"

import { GardenProvider } from "@/context/GardenContext"
import { GardenPlannerContent } from "@/components/garden-planner-content"

// Main component
export default function GardenPlanner({ userId }: { userId: number }) {
  return (
    <GardenProvider userId={userId}>
      <GardenPlannerContent />
    </GardenProvider>
  )
}
