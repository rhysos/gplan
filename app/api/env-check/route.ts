import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Just check if the environment variables exist without accessing their values
    const envVars = {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      NODE_ENV: process.env.NODE_ENV || "not set",
    }

    return NextResponse.json({
      success: true,
      data: envVars,
    })
  } catch (error) {
    console.error("Error checking environment variables:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
      },
      { status: 500 },
    )
  }
}
