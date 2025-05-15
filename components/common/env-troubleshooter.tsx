import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function EnvironmentTroubleshooter() {
  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Environment Variables Troubleshooting Guide</CardTitle>
        <CardDescription>Follow these steps to resolve issues with environment variables</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step-1">
            <AccordionTrigger>1. Check Environment Variable Format</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Make sure you've added the environment variables in the correct format:</p>
              <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                CLOUDINARY_CLOUD_NAME=your_cloud_name{"\n"}
                CLOUDINARY_API_KEY=your_api_key
              </pre>
              <p className="mt-2">
                Ensure there are no spaces around the equals sign and no quotes around the values unless they're part of
                the value itself.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-2">
            <AccordionTrigger>2. Verify in Vercel Dashboard</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to your project in the Vercel dashboard</li>
                <li>Click on "Settings" → "Environment Variables"</li>
                <li>Confirm that both variables are listed with the correct values</li>
                <li>Make sure they're set for all environments (Production, Preview, Development)</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-3">
            <AccordionTrigger>3. Restart Development Server</AccordionTrigger>
            <AccordionContent>
              <p>
                If you're running locally, stop your development server and restart it to pick up the new environment
                variables:
              </p>
              <pre className="bg-muted p-2 rounded-md text-sm mt-2 overflow-x-auto">
                # Stop the current server with Ctrl+C, then restart{"\n"}
                npm run dev
              </pre>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-4">
            <AccordionTrigger>4. Clear Browser Cache</AccordionTrigger>
            <AccordionContent>
              <p>Try clearing your browser cache or opening the application in an incognito/private window.</p>
              <p className="mt-2">
                <strong>Chrome:</strong> Settings → Privacy and Security → Clear browsing data
              </p>
              <p>
                <strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data → Clear Data
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-5">
            <AccordionTrigger>5. Redeploy Your Application</AccordionTrigger>
            <AccordionContent>
              <p>
                If you're seeing this in a deployed version, you might need to trigger a new deployment for the
                environment variables to take effect.
              </p>
              <p className="mt-2">
                In the Vercel dashboard, go to your project and click "Redeploy" from the "..." menu.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-6">
            <AccordionTrigger>6. Check for Typos</AccordionTrigger>
            <AccordionContent>
              <p>Make sure the variable names match exactly what the code is looking for (case-sensitive):</p>
              <ul className="list-disc pl-5 mt-2">
                <li>CLOUDINARY_CLOUD_NAME</li>
                <li>CLOUDINARY_API_KEY</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-7">
            <AccordionTrigger>7. Use .env.local File (Local Development)</AccordionTrigger>
            <AccordionContent>
              <p>
                For local development, create a <code>.env.local</code> file in the root of your project:
              </p>
              <pre className="bg-muted p-2 rounded-md text-sm mt-2 overflow-x-auto">
                CLOUDINARY_CLOUD_NAME=your_cloud_name{"\n"}
                CLOUDINARY_API_KEY=your_api_key
              </pre>
              <p className="mt-2">Restart your development server after creating or modifying this file.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Alert className="mt-6">
          <AlertDescription>
            If you've tried all these steps and are still having issues, you might need to check if your environment
            variables are being properly exposed to your application. Some frameworks require additional configuration
            to expose environment variables to the client-side code.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
