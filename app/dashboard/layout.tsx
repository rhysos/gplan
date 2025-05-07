"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { DatabaseErrorBoundary } from "@/components/db-error-boundary"
import { Button } from "@/components/ui/button"
import { Home, Flower } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current pathname
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            {/* Option 1: Using Next.js Image with proper configuration */}
            <Image
              src="https://res.cloudinary.com/amethyst/image/upload/v1746592812/g-plan_vktxdk.png"
              alt="G-PLAN - See Your Garden"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
              unoptimized
            />

            {/* Option 2: If Image component is causing issues, use standard img tag */}
            {/* <img
              src="https://res.cloudinary.com/amethyst/image/upload/v1746592812/g-plan_vktxdk.png"
              alt="G-PLAN - See Your Garden"
              className="h-10 w-auto"
            /> */}
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant={pathname === "/dashboard" ? "default" : "ghost"} asChild size="sm" className="text-xs">
              <Link href="/dashboard">
                <Home className="h-3.5 w-3.5 mr-1.5" />
                Gardens
              </Link>
            </Button>
            <Button
              variant={pathname === "/dashboard/flowers" ? "default" : "ghost"}
              asChild
              size="sm"
              className="text-xs"
            >
              <Link href="/dashboard/flowers">
                <Flower className="h-3.5 w-3.5 mr-1.5" />
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
