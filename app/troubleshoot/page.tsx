import { EnvironmentChecker } from "@/components/common/env-checker"
import { EnvironmentTroubleshooter } from "@/components/common/env-troubleshooter"

export const metadata = {
  title: "Environment Troubleshooter",
  description: "Diagnose and fix environment variable issues",
}

export default function TroubleshootPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Environment Variables Troubleshooter</h1>

      <EnvironmentChecker />
      <EnvironmentTroubleshooter />

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>This page helps you diagnose issues with environment variables in your application.</p>
        <p className="mt-2">
          <a href="/api/env-check" className="underline" target="_blank" rel="noopener noreferrer">
            View Raw Environment Check Data
          </a>
        </p>
      </div>
    </div>
  )
}
