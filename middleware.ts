import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session_id")
  const { pathname } = request.nextUrl

  // If there's no session and the user is trying to access protected routes
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // If there's a session and the user is trying to access auth routes
  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Match all request paths except for the ones starting with:
// - api (API routes)
// - _next/static (static files)
// - _next/image (image optimization files)
// - favicon.ico (favicon file)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
