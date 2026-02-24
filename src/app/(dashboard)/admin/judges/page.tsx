import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminJudgesClient } from './admin-judges-client'

export default async function AdminJudgesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get all judges
    const { data: judges } = await supabase
        .from('user_roles')
        .select('id, created_at, profiles!user_roles_id_fkey(first_name, last_name)')
        .eq('role', 'judge')
        .order('created_at', { ascending: false })

    // Get all submitted submissions for assignment
    const { data: submissions } = await supabase
        .from('submissions')
        .select('id, reference_code, title, category')
        .in('status', ['submitted', 'under_review', 'shortlisted'])

    // Get existing assignments
    const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('id, judge_id, submission_id')

    return (
        <AdminJudgesClient
            judges={(judges ?? []) as unknown as never}
            submissions={submissions ?? []}
            assignments={assignments ?? []}
        />
    )
}
