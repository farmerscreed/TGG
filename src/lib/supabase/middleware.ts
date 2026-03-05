import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value)
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // Refresh session if expired - this sets the session cookie
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const { pathname } = request.nextUrl

    // Public routes — no auth needed
    const publicRoutes = ['/login', '/register', '/reset-password', '/auth/callback', '/', '/index.html']
    const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))

    // Not authenticated → redirect to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
