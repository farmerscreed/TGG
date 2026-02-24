import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Public routes — no auth needed
    const publicRoutes = ['/login', '/register', '/reset-password', '/auth/callback']
    const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

    // Not authenticated → redirect to login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Authenticated user on auth pages → redirect to their dashboard
    if (user && isPublicRoute && !pathname.startsWith('/auth/callback')) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .single()

        const roleRedirects: Record<string, string> = {
            admin: '/admin',
            coordinator: '/coordinator',
            judge: '/judge',
            participant: '/participant',
        }
        const url = request.nextUrl.clone()
        url.pathname = roleRedirects[roleData?.role ?? 'participant'] ?? '/participant'
        return NextResponse.redirect(url)
    }

    // Role-based route guards for authenticated users
    if (user && !isPublicRoute) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = roleData?.role

        const routeRoleMap: Record<string, string[]> = {
            '/admin': ['admin'],
            '/coordinator': ['coordinator'],
            '/judge': ['judge'],
            '/participant': ['participant'],
        }

        for (const [routePrefix, allowedRoles] of Object.entries(routeRoleMap)) {
            if (pathname.startsWith(routePrefix) && !allowedRoles.includes(role ?? '')) {
                const roleRedirects: Record<string, string> = {
                    admin: '/admin',
                    coordinator: '/coordinator',
                    judge: '/judge',
                    participant: '/participant',
                }
                const url = request.nextUrl.clone()
                url.pathname = roleRedirects[role ?? 'participant'] ?? '/login'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}
