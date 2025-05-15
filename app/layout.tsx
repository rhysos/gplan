import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { initializeAuth } from "@/lib/auth"
import { SessionProvider } from "@/components/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Garden Planner",
  description: "Plan your garden with rows and plants",
  // Ensure we're not setting any PWA-related metadata
  manifest: false,
  themeColor: null,
  appleWebApp: false,
    generator: 'v0.dev'
}

// Warm up the database connection when the app loads
initializeAuth().catch((error) => {
  console.error("Failed to initialize auth:", error)
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* Ensure no service worker registration */}</head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
