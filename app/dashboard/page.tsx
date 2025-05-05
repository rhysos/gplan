import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import GardenPlanner from "@/components/garden-planner"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Add debug logging
  console.log("Dashboard page - User:", user ? "User found" : "No user found")

  if (!user) {
    console.log("No user found, redirecting to login")
    redirect("/login?error=auth_required")
  }

  return (
    <div>
      <GardenPlanner userId={user.id} />
    </div>
  )
}
