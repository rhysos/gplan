import { GardenPlanner } from "@/components/garden-planner"
import { InstructionsPanel } from "@/components/dashboard/instructions-panel"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Garden Planner</h1>
      <InstructionsPanel />
      <GardenPlanner />
    </div>
  )
}
