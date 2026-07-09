import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoordinatorParticipantsClient } from './coordinator-participants-client'

export default async function CoordinatorParticipantsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get coordinator's university
    const { data: role } = await supabase
        .from('user_roles')
        .select('university')
        .eq('id', user.id)
        .eq('role', 'coordinator')
        .single()

    if (!role) redirect('/coordinator')

    // user_roles and profiles have no direct FK between them (both point at
    // auth.users), so fetch each and merge by id rather than embedding.
    const { data: roles } = await supabase
        .from('user_roles')
        .select('id, created_at')
        .eq('role', 'participant')
        .eq('university', role.university)
        .order('created_at', { ascending: false })

    const ids = (roles ?? []).map(r => r.id)
    const { data: profs } = ids.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, phone, gender, department, year_of_study, participation_type')
            .in('user_id', ids)
        : { data: [] }

    const profileByUser = new Map((profs ?? []).map(p => [p.user_id, p]))
    const participants = (roles ?? []).map(r => ({
        id: r.id,
        created_at: r.created_at,
        profiles: profileByUser.get(r.id) ?? null,
    }))

    return (
        <CoordinatorParticipantsClient
            participants={participants as unknown as never}
            university={role.university}
        />
    )
}
