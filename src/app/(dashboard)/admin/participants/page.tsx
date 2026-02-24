import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminParticipantsClient } from './admin-participants-client'

interface PageProps {
    searchParams: Promise<{ university?: string; q?: string }>
}

export default async function AdminParticipantsPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { university, q } = await searchParams

    let query = supabase
        .from('user_roles')
        .select(`
      id, university, created_at,
      profiles!user_roles_id_fkey(first_name, last_name, phone, gender, department, year_of_study, participation_type)
    `)
        .eq('role', 'participant')
        .order('created_at', { ascending: false })

    if (university && university !== 'all') query = query.eq('university', university)
    if (q) {
        // Search by profile name — handled client-side for now since ilike across join is complex
    }

    const { data: participants } = await query.limit(200)

    return <AdminParticipantsClient participants={(participants ?? []) as unknown as never} currentUniversity={university ?? 'all'} searchQ={q ?? ''} />
}
