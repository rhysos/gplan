import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

// Mark this route as dynamic since it uses cookies via getSession
export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
