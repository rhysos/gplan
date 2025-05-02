import Link from "next/link"

export const metadata = {
  title: "Environment Test",
  description: "Simple environment variable test",
}

export default function EnvTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variable Test</h1>

      <p className="mb-4">
        This is a simple page to test environment variables. Click the button below to check your environment variables.
      </p>

      <div className="flex gap-4">
        <Link
          href="/api/env-check"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          target="_blank"
        >
          Check Environment Variables
        </Link>

        <Link href="/troubleshoot" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Go to Troubleshooter
        </Link>
      </div>
    </div>
  )
}
