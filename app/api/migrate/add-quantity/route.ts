import { NextResponse } from "next/server"
import { addQuantityColumn } from "@/lib/actions/flower-actions"

export async function GET() {
  try {
    const result = await addQuantityColumn()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ success: false, error: "Failed to run migration" }, { status: 500 })
  }
}
