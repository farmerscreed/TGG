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

    // Use the secure RPC function to fetch participants + profiles bypassing RLS loops
    const { data: participantsData, error } = await supabase
        .rpc('get_admin_participants')

    if (error) {
        console.error('Error fetching participants:', error)
        return <AdminParticipantsClient participants={[]} currentUniversity={university ?? 'all'} searchQ={q ?? ''} />
    }

    // Transform the flat table result into the nested structure expected by the client
    const participants = (participantsData ?? []).map((p: any) => ({
        id: p.id,
        created_at: p.created_at,
        profiles: {
            first_name: p.first_name,
            last_name: p.last_name,
            university: p.university,
            department: p.department,
            year_of_study: p.year_of_study,
            phone: p.phone,
            gender: p.gender,
            participation_type: p.participation_type
        }
    }))

    return <AdminParticipantsClient participants={participants as any} currentUniversity={university ?? 'all'} searchQ={q ?? ''} />
}
