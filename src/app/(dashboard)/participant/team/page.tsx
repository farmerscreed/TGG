import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamClient } from './team-client'

export default async function TeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('university, participation_type').eq('user_id', user.id).single()

    // Get team where user is lead OR member
    const { data: ownTeam } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('lead_user_id', user.id)
        .maybeSingle()

    const { data: memberRecord } = await supabase
        .from('team_members')
        .select('teams(*, team_members(*))')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

    const team = ownTeam ?? (memberRecord?.teams as unknown as Record<string, unknown> | null) ?? null

    return (
        <TeamClient
            userId={user.id}
            userEmail={user.email ?? ''}
            university={profile?.university ?? ''}
            participationType={profile?.participation_type ?? ''}
            team={team}
        />
    )
}
