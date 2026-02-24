import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, MobileNav } from '@/components/layout/nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()

    const role = (roleData?.role ?? 'participant') as 'participant' | 'admin' | 'judge' | 'coordinator'
    const firstName = profile?.first_name ?? ''
    const lastName = profile?.last_name ?? ''
    const userName = firstName ? `${firstName} ${lastName}`.trim() : user.email ?? 'User'
    const userInitials = firstName
        ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase()
        : (user.email?.[0] ?? 'U').toUpperCase()

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar role={role} userName={userName} userInitials={userInitials} />
            {/* Main content — offset for desktop sidebar */}
            <main className="md:ml-64 min-h-screen pb-20 md:pb-8">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    {children}
                </div>
            </main>
            <MobileNav role={role} />
        </div>
    )
}
