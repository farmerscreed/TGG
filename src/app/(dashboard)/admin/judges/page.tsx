import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminJudgesClient } from './admin-judges-client'

export default async function AdminJudgesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get all judges. user_roles and profiles share no direct FK (both point at
    // auth.users), so fetch each and merge by id rather than embedding.
    const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('id, created_at')
        .eq('role', 'judge')
        .order('created_at', { ascending: false })

    const judgeIds = (judgeRoles ?? []).map(r => r.id)
    const { data: judgeProfiles } = judgeIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', judgeIds)
        : { data: [] }

    const judgeProfileByUser = new Map((judgeProfiles ?? []).map(p => [p.user_id, p]))
    const judges = (judgeRoles ?? []).map(r => ({
        id: r.id,
        created_at: r.created_at,
        profiles: judgeProfileByUser.get(r.id) ?? null,
    }))

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
