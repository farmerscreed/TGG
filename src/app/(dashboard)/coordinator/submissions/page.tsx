import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoordinatorSubmissionsClient } from './coordinator-submissions-client'

export default async function CoordinatorSubmissionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: role } = await supabase
        .from('user_roles')
        .select('university')
        .eq('id', user.id)
        .eq('role', 'coordinator')
        .single()

    if (!role) redirect('/coordinator')

    // Get submissions by participants from this university
    const { data: submissions } = await supabase
        .from('submissions')
        .select(`
            id, reference_code, title, category, status, updated_at, is_locked,
            profiles!submissions_user_id_fkey(first_name, last_name, university)
        `)
        .eq('profiles.university', role.university)
        .order('updated_at', { ascending: false })
        .limit(100)

    return (
        <CoordinatorSubmissionsClient
            submissions={(submissions ?? []).filter(s => (s.profiles as { university?: string } | null)?.university === role.university) as unknown as never}
            university={role.university}
        />
    )
}
