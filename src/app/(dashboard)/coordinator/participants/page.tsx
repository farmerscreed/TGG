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

    const { data: participants } = await supabase
        .from('user_roles')
        .select(`
            id, created_at,
            profiles!user_roles_id_fkey(first_name, last_name, phone, gender, department, year_of_study, participation_type)
        `)
        .eq('role', 'participant')
        .eq('university', role.university)
        .order('created_at', { ascending: false })

    return (
        <CoordinatorParticipantsClient
            participants={(participants ?? []) as unknown as never}
            university={role.university}
        />
    )
}
