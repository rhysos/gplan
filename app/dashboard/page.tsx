import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import GardenPlanner from "@/components/garden-planner"
import { InstructionsPanel } from "@/components/dashboard/instructions-panel"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Garden Planner</h1>
      <InstructionsPanel />
      <GardenPlanner userId={user.id} />
    </div>
  )
}
