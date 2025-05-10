import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import GardenPlanner from "@/components/garden-planner"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div>
      <GardenPlanner userId={user.id} />
    </div>
  )
}
