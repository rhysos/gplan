"use client"

import { GardenProvider } from "@/context/garden-context"
import { GardenPlannerContent } from "@/components/dashboard/garden-planner-content"

// Main component
export default function GardenPlanner({ userId }: { userId: number }) {
  return (
    <GardenProvider userId={userId}>
      <GardenPlannerContent />
    </GardenProvider>
  )
}
