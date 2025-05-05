import type React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DatabaseErrorBoundary } from "@/components/db-error-boundary"
import { Button } from "@/components/ui/button"
import { Home, Flower } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current user
  const user = await getCurrentUser()

  // Add debug logging
  console.log("Dashboard layout - User:", user ? "User found" : "No user found")

  // If no user is found, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login")
    redirect("/login?error=auth_required")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Garden Planner</h1>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Gardens
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/flowers">
                <Flower className="h-4 w-4 mr-2" />
                Flowers
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <ErrorBoundary
        fallback={<p className="p-4">Something went wrong loading the dashboard. Please try again later.</p>}
      >
        <DatabaseErrorBoundary>{children}</DatabaseErrorBoundary>
      </ErrorBoundary>
    </div>
  )
}
