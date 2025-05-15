"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface DatabaseErrorBoundaryProps {
  children: React.ReactNode
}

export function DatabaseErrorBoundary({ children }: DatabaseErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Listen for unhandled errors that might be database related
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("database") ||
        event.error?.message?.includes("Failed to fetch") ||
        event.error?.message?.includes("connection")
      ) {
        event.preventDefault()
        setHasError(true)
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  const handleRetry = () => {
    setIsRetrying(true)
    setRetryCount((prev) => prev + 1)

    // Wait a bit before retrying to allow potential connection issues to resolve
    setTimeout(() => {
      setHasError(false)
      setIsRetrying(false)
      window.location.reload()
    }, 2000)
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Database Connection Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          We're having trouble connecting to our database. This might be a temporary issue.
        </p>
        <Button onClick={handleRetry} disabled={isRetrying} className="flex items-center gap-2">
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </>
          )}
        </Button>
        {retryCount > 0 && <p className="mt-4 text-sm text-muted-foreground">Retry attempts: {retryCount}</p>}
      </div>
    )
  }

  return <>{children}</>
}
