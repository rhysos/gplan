import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check for environment variables without accessing their values directly
    const envStatus = {
      cloudinaryCloudName: {
        set: typeof process.env.CLOUDINARY_CLOUD_NAME === "string" && process.env.CLOUDINARY_CLOUD_NAME.length > 0,
        // Don't include even partial values for security
      },
      cloudinaryApiKey: {
        set: typeof process.env.CLOUDINARY_API_KEY === "string" && process.env.CLOUDINARY_API_KEY.length > 0,
        // Don't include even partial values for security
      },
      // Include basic environment info that's not sensitive
      nodeEnv: process.env.NODE_ENV || "not set",
    }

    // Return a simple response
    return NextResponse.json({
      status: "success",
      data: envStatus,
    })
  } catch (error) {
    console.error("Error in test-env API route:", error)

    // Return a safe error response
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check environment variables",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
