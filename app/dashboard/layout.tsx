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
            <Image
              src="https://res.cloudinary.com/amethyst/image/upload/v1747123032/bloomsinrows1_dav8n8.png"
              alt="Blooms In Rows"
              width={240}
              height={70}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              priority
              unoptimized
            />
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
