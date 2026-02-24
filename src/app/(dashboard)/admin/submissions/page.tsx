import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSubmissionsClient } from './admin-submissions-client'

interface PageProps {
    searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { status, q } = await searchParams

    let query = supabase
        .from('submissions')
        .select(`
      id, reference_code, title, status, category, created_at, updated_at, is_locked,
      profiles!submissions_user_id_fkey(first_name, last_name, university)
    `)
        .order('updated_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)
    if (q) query = query.ilike('title', `%${q}%`)

    const { data: submissions } = await query.limit(100)

    return <AdminSubmissionsClient submissions={(submissions ?? []) as unknown as never} currentStatus={status ?? 'all'} searchQ={q ?? ''} />
}
