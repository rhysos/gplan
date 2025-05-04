import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    try {
      // Check if the column exists
      await sql`SELECT row_ends FROM garden_rows LIMIT 1`
      return NextResponse.json({
        success: true,
        message: "Row ends column already exists",
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('column "row_ends" does not exist')) {
        // Add the column as INTEGER with default 0
        await sql`ALTER TABLE garden_rows ADD COLUMN row_ends INTEGER DEFAULT 0 NOT NULL`
        return NextResponse.json({
          success: true,
          message: "Row ends column added successfully",
        })
      }
      throw error
    }
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add row_ends column",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
