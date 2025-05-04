import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import GardenPlanner from "@/components/garden-planner"
import { RowEndsMigration } from "@/components/row-ends-migration"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div>
      <RowEndsMigration />
      <GardenPlanner userId={user.id} />
    </div>
  )
}
