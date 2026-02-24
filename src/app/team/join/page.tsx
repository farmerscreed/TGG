import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TeamJoinClient from './team-join-client'

interface PageProps {
    searchParams: Promise<{ token?: string }>
}

export default async function TeamJoinPage({ searchParams }: PageProps) {
    const { token } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Save the token so we can redirect back after login
        redirect(`/login?redirect=/team/join${token ? `?token=${token}` : ''}`)
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f9fa]">
                <div className="text-center space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <span className="text-2xl">❌</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#1a1a1a]">Invalid Invite Link</h1>
                    <p className="text-gray-500 text-sm">This invite link is missing a token. Please ask your team lead to resend the invite.</p>
                </div>
            </div>
        )
    }

    // Look up invite by token
    const { data: invite } = await supabase
        .from('team_members')
        .select('id, team_id, status, teams(name, team_lead_id)')
        .eq('invite_token', token)
        .single()

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#1a5c38] to-[#154d30]">
            <TeamJoinClient
                userId={user.id}
                userEmail={user.email ?? ''}
                invite={invite as unknown as never}
                token={token}
            />
        </div>
    )
}
