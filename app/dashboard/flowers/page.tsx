import { redirect } from "next/navigation"
import { getAllFlowers, getFlowerUsageCounts } from "@/lib/actions/flower-actions"
import { getCurrentUser } from "@/lib/auth"
import FlowerManagement from "@/components/flower-management"

export const dynamic = 'force-dynamic'

export default async function FlowersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const flowers = await getAllFlowers(user.id)
  const usageCounts = await getFlowerUsageCounts()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Flower Management</h1>
      <FlowerManagement initialFlowers={flowers} usageCounts={usageCounts} userId={user.id} />
    </div>
  )
}
