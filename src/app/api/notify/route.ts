import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

type EmailType = 'submission_received' | 'status_update' | 'team_invite' | 'judge_welcome'

const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    winner: 'Winner!',
    not_selected: 'Not Selected',
    disqualified: 'Disqualified',
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
        to?: string
        type: EmailType
        payload: Record<string, string>
    }

    const { type, payload } = body
    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

    let emailContent: { subject: string; html: string; text: string }
    let recipientEmail = body.to

    // ---- status_update: look up the submission submitter from DB ----
    if (type === 'status_update') {
        const { submissionId, status } = payload
        if (!submissionId || !status) return NextResponse.json({ error: 'submissionId and status required' }, { status: 400 })

        // Skip non-participant-facing transitions
        if (!['under_review', 'shortlisted', 'winner', 'not_selected'].includes(status)) {
            return NextResponse.json({ success: true, skipped: true })
        }

        const { data: sub } = await supabase
            .from('submissions')
            .select('reference_code, title, user_id')
            .eq('id', submissionId)
            .single()

        if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

        const { data: profile } = await supabase
            .from('profiles').select('first_name, last_name').eq('id', sub.user_id).single()

        const { data: authUser } = await supabase.auth.admin.getUserById(sub.user_id)
        if (!authUser?.user?.email) return NextResponse.json({ error: 'User email not found' }, { status: 404 })

        recipientEmail = authUser.user.email
        emailContent = emailTemplates.statusUpdate({
            name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Participant',
            title: sub.title || 'Untitled',
            referenceCode: sub.reference_code,
            status,
            statusLabel: STATUS_LABELS[status] ?? status,
        })
    }

    // ---- submission_received: `to` must be provided, name looked up from profile ----
    else if (type === 'submission_received') {
        if (!recipientEmail) return NextResponse.json({ error: 'to is required' }, { status: 400 })
        const { data: profile } = await supabase
            .from('profiles').select('first_name, last_name').eq('id', user.id).single()

        emailContent = emailTemplates.submissionReceived({
            name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Participant',
            title: payload.title ?? '',
            referenceCode: payload.referenceCode ?? '',
        })
    }

    // ---- team_invite: all data comes from client ----
    else if (type === 'team_invite') {
        if (!recipientEmail) return NextResponse.json({ error: 'to is required' }, { status: 400 })
        emailContent = emailTemplates.teamInvite({
            inviteeName: payload.inviteeName ?? recipientEmail,
            teamName: payload.teamName ?? '',
            teamLeadName: payload.teamLeadName ?? '',
            inviteUrl: payload.inviteUrl ?? '',
        })
    }

    // ---- judge_welcome: triggered server-side from create-judge ----
    else if (type === 'judge_welcome') {
        if (!recipientEmail) return NextResponse.json({ error: 'to is required' }, { status: 400 })
        emailContent = emailTemplates.judgeWelcome({
            name: payload.name ?? recipientEmail,
            email: recipientEmail,
        })
    }

    else {
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    if (!recipientEmail) return NextResponse.json({ error: 'Recipient email could not be resolved' }, { status: 400 })

    const result = await sendEmail({ to: recipientEmail, ...emailContent })
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })

    return NextResponse.json({ success: true })
}
