'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

/**
 * Called immediately after a submission is set to 'submitted' status.
 * Sends a confirmation email to the submitter.
 */
export async function triggerSubmissionReceivedEmail(submissionId: string) {
    const supabase = await createClient()

    const { data: sub } = await supabase
        .from('submissions')
        .select('reference_code, title, user_id')
        .eq('id', submissionId)
        .single()

    if (!sub) return

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', sub.user_id)
        .single()

    const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id)

    if (!authUser?.user?.email) return

    await sendEmail({
        to: authUser.user.email,
        ...emailTemplates.submissionReceived({
            name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Participant',
            title: sub.title || 'Untitled Submission',
            referenceCode: sub.reference_code,
        }),
    })
}

/**
 * Called when an admin updates a submission status.
 * Sends a status update email to the submitter.
 */
export async function triggerStatusUpdateEmail(submissionId: string, newStatus: string) {
    const supabase = await createClient()

    const STATUS_LABELS: Record<string, string> = {
        submitted: 'Submitted',
        under_review: 'Under Review',
        shortlisted: 'Shortlisted',
        winner: 'Winner!',
        not_selected: 'Not Selected',
        disqualified: 'Disqualified',
    }

    // Only send for meaningful status transitions
    if (!['under_review', 'shortlisted', 'winner', 'not_selected'].includes(newStatus)) return

    const { data: sub } = await supabase
        .from('submissions')
        .select('reference_code, title, user_id')
        .eq('id', submissionId)
        .single()

    if (!sub) return

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', sub.user_id)
        .single()

    const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id)

    if (!authUser?.user?.email) return

    await sendEmail({
        to: authUser.user.email,
        ...emailTemplates.statusUpdate({
            name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Participant',
            title: sub.title || 'Untitled',
            referenceCode: sub.reference_code,
            status: newStatus,
            statusLabel: STATUS_LABELS[newStatus] ?? newStatus,
        }),
    })
}

/**
 * Called when a team member invite is created.
 * Sends an invite email to the invitee's email.
 */
export async function triggerTeamInviteEmail({
    inviteeEmail,
    inviteeName,
    teamName,
    teamLeadName,
    inviteToken,
}: {
    inviteeEmail: string
    inviteeName: string
    teamName: string
    teamLeadName: string
    inviteToken: string
}) {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tgg-eco.vercel.app'
    const inviteUrl = `${APP_URL}/team/join?token=${inviteToken}`

    await sendEmail({
        to: inviteeEmail,
        ...emailTemplates.teamInvite({
            inviteeName: inviteeName || inviteeEmail,
            teamName,
            teamLeadName,
            inviteUrl,
        }),
    })
}
