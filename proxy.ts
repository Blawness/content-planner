import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (publicPaths.some((p) => p === pathname || pathname === p + '/')) {
    return NextResponse.next()
  }
  const token = request.cookies.get('content_planner_token')?.value
  const guest = request.cookies.get('content_planner_guest')?.value
  const hasAccess = !!token || guest === '1'
  const isDashboard = pathname.startsWith('/dashboard')
  if (isDashboard && !hasAccess) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
