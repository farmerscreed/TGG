import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JudgeScoringClient } from './judge-scoring-client'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function JudgeScorePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify assignment
    const { data: assignment } = await supabase
        .from('judge_assignments')
        .select('id')
        .eq('judge_id', user.id)
        .eq('submission_id', id)
        .single()

    if (!assignment) notFound()

    // Get submission (blind — no profile info for true anonymization)
    const { data: submission } = await supabase
        .from('submissions')
        .select('id, reference_code, title, category, problem_statement, proposed_solution, innovation_approach, expected_impact, video_link, status')
        .eq('id', id)
        .single()

    if (!submission) notFound()

    // Get submission files
    const { data: files } = await supabase
        .from('submission_files')
        .select('id, file_name, file_url, file_type')
        .eq('submission_id', id)

    // Get judging criteria
    const { data: criteria } = await supabase
        .from('judging_criteria')
        .select('*')
        .order('order_index')

    // Get existing scores for this judge
    const { data: existingScores } = await supabase
        .from('judging_scores')
        .select('*')
        .eq('submission_id', id)
        .eq('judge_id', user.id)
        .maybeSingle()

    // Check if judging is locked
    const { data: settings } = await supabase
        .from('challenge_settings')
        .select('judging_locked')
        .single()

    return (
        <JudgeScoringClient
            submission={submission}
            files={files ?? []}
            criteria={criteria ?? []}
            existingScores={existingScores}
            judgeId={user.id}
            isLocked={settings?.judging_locked ?? false}
        />
    )
}
