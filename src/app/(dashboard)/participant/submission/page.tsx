import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubmissionFormClient } from './submission-form-client'

export default async function SubmissionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: submission }, { data: categories }, { data: profile }] = await Promise.all([
        supabase.from('submissions').select('*, submission_files(*)').eq('user_id', user.id).single(),
        supabase.from('challenge_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('profiles').select('participation_type, university').eq('user_id', user.id).single(),
    ])

    // Challenge settings
    const { data: settings } = await supabase.from('challenge_settings').select('*').single()

    const now = new Date()
    const submissionOpen = settings?.submission_open ? new Date(settings.submission_open) : null
    const submissionDeadline = settings?.submission_deadline ? new Date(settings.submission_deadline) : null
    const isOpen = (!submissionOpen || now >= submissionOpen) && (!submissionDeadline || now <= submissionDeadline)

    return (
        <SubmissionFormClient
            userId={user.id}
            userEmail={user.email ?? ''}
            existingSubmission={submission}
            existingFiles={submission?.submission_files ?? []}
            categories={categories ?? []}
            profile={profile}
            isOpen={isOpen}
            deadlineText={submissionDeadline?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) ?? null}
        />
    )
}
