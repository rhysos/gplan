"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react"

interface EnvStatus {
  cloudinaryCloudName: { set: boolean }
  cloudinaryApiKey: { set: boolean }
  nodeEnv: string
}

export function EnvironmentChecker() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const checkEnvironmentVariables = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-env")

      if (!response.ok) {
        throw new Error(`Error checking environment variables: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "error") {
        throw new Error(data.message || "Unknown error")
      }

      setEnvStatus(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check environment variables")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await checkEnvironmentVariables()
    setRefreshing(false)
  }

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Checking Environment Variables</CardTitle>
          <CardDescription>Please wait while we check your environment setup...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Error Checking Environment</CardTitle>
          <CardDescription>There was a problem checking your environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Try Again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!envStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Could not retrieve environment information</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleRefresh}>Retry</Button>
        </CardFooter>
      </Card>
    )
  }

  const allVariablesSet = envStatus.cloudinaryCloudName.set && envStatus.cloudinaryApiKey.set

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Environment Variables Status
          {allVariablesSet ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">
              <CheckCircle className="h-3 w-3 mr-1" /> All Set
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" /> Issues Found
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Current environment: <Badge variant="secondary">{envStatus.nodeEnv}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">CLOUDINARY_CLOUD_NAME</div>
            <div>
              {envStatus.cloudinaryCloudName.set ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Set
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Set
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-medium">CLOUDINARY_API_KEY</div>
            <div>
              {envStatus.cloudinaryApiKey.set ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Set
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Set
                </div>
              )}
            </div>
          </div>
        </div>

        {!allVariablesSet && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Environment Variables</AlertTitle>
            <AlertDescription>
              Some required environment variables are not set. Please check the troubleshooting steps below.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}
