"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

export function RowEndsMigration() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null)

  const runMigration = async () => {
    setIsMigrating(true)
    setMigrationStatus("Running migration...")

    try {
      const response = await fetch("/api/migrate/add-row-ends")
      const result = await response.json()

      if (result.success) {
        setMigrationStatus("Migration successful! Refresh the page to see changes.")
      } else {
        setMigrationStatus(`Migration failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      setMigrationStatus("Migration failed. Please try again.")
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Database Update Required</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>The database needs to be updated to support row ends measurements.</span>
        <Button variant="outline" size="sm" onClick={runMigration} disabled={isMigrating} className="ml-4">
          {isMigrating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Database
            </>
          )}
        </Button>
      </AlertDescription>
      {migrationStatus && <p className="text-sm mt-2">{migrationStatus}</p>}
    </Alert>
  )
}
