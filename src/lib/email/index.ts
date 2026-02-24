import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'TGG Eco-Challenge <noreply@tgg-eco.org>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tgg-eco.vercel.app'

// ---------- Helpers ----------

function baseLayout(body: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TGG Campus Eco-Challenge 2026</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f7f5; color: #1a1a1a; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,.08); }
  .header { background: linear-gradient(135deg, #1a5c38, #2e7d52); padding: 28px 32px; text-align: center; }
  .header img { height: 44px; margin-bottom: 10px; }
  .header h1 { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .header p  { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
  .body { padding: 32px; }
  .body p { font-size: 15px; line-height: 1.65; color: #333; margin-bottom: 14px; }
  .body p.muted { font-size: 13px; color: #888; }
  .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
  .card p { margin: 0; font-size: 14px; color: #166534; }
  .card strong { display: block; font-size: 13px; color: #4ade80; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
  .btn { display: inline-block; margin: 20px 0; padding: 14px 28px; background: #1a5c38; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .divider { border: none; border-top: 1px solid #e8ede9; margin: 24px 0; }
  .footer { background: #f4f7f5; padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #9e9e9e; line-height: 1.6; }
  .badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .badge-green   { background: #dcfce7; color: #16a34a; }
  .badge-blue    { background: #dbeafe; color: #1d4ed8; }
  .badge-purple  { background: #f3e8ff; color: #7c3aed; }
  .badge-yellow  { background: #fef9c3; color: #a16207; }
  .badge-red     { background: #fee2e2; color: #dc2626; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🌿 TGG Campus Eco-Challenge 2026</html>
    <p>Innovating for a Greener Future</p>
  </div>
  <div class="body">
    ${body}
  </div>
  <div class="footer">
    <p>TGG Campus Eco-Challenge 2026 · Rivers State, Nigeria</p>
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</div>
</body>
</html>
`
}

// ---------- Templates ----------

export const emailTemplates = {

    /** New user registration welcome */
    registrationWelcome({ name, university }: { name: string; university: string }) {
        const html = baseLayout(`
            <p>Hi <strong>${name}</strong>,</p>
            <p>Welcome to the <strong>TGG Campus Eco-Challenge 2026</strong>! Your account has been created and you're registered under <strong>${university}</strong>.</p>
            <p>You can now log in to complete your profile and begin your submission.</p>
            <div class="card">
                <strong>Next steps</strong>
                <p>1. Complete your profile<br/>2. Form or join a team (if applying as a group)<br/>3. Submit your eco-innovation idea before the deadline</p>
            </div>
            <a href="${APP_URL}/participant" class="btn">Go to My Dashboard →</a>
            <hr class="divider" />
            <p class="muted">If you did not create this account, please ignore this email.</p>
        `)
        return {
            subject: '🌿 Welcome to TGG Eco-Challenge 2026!',
            html,
            text: `Hi ${name}, welcome to TGG Campus Eco-Challenge 2026! Log in at ${APP_URL}/participant`,
        }
    },

    /** Submission successfully received */
    submissionReceived({ name, title, referenceCode }: { name: string; title: string; referenceCode: string }) {
        const html = baseLayout(`
            <p>Hi <strong>${name}</strong>,</p>
            <p>Great news — your submission has been received and is now under review by our team!</p>
            <div class="card">
                <strong>Submission Details</strong>
                <p><strong>Title:</strong> ${title}<br/><strong>Reference Code:</strong> ${referenceCode}</p>
            </div>
            <p>Keep this reference code safe — you'll need it if you want to follow up with our team.</p>
            <p>You can track the status of your submission from your dashboard at any time.</p>
            <a href="${APP_URL}/participant" class="btn">Track My Submission →</a>
            <hr class="divider" />
            <p class="muted">Questions? Contact your campus coordinator or email support.</p>
        `)
        return {
            subject: `✅ Submission Received — ${referenceCode}`,
            html,
            text: `Hi ${name}, your submission "${title}" (${referenceCode}) has been received. Track it at ${APP_URL}/participant`,
        }
    },

    /** Submission status changed */
    statusUpdate({ name, title, referenceCode, status, statusLabel }: {
        name: string; title: string; referenceCode: string; status: string; statusLabel: string
    }) {
        const badgeClass: Record<string, string> = {
            submitted: 'badge-blue',
            under_review: 'badge-yellow',
            shortlisted: 'badge-purple',
            winner: 'badge-green',
            not_selected: 'badge-red',
        }
        const badge = badgeClass[status] ?? 'badge-blue'
        const congratsMsg = status === 'shortlisted' ? '<p>🎉 <strong>Congratulations!</strong> Your submission has been shortlisted for the final judging round. We will be in touch with more details soon.</p>' : ''
        const winnerMsg = status === 'winner' ? '<p>🏆 <strong>You\'re a winner!</strong> Your eco-innovation idea has been selected as one of this year\'s winners. We\'re thrilled to have you represent TGG\'s commitment to sustainability.</p>' : ''

        const html = baseLayout(`
            <p>Hi <strong>${name}</strong>,</p>
            <p>There's an update on your TGG Eco-Challenge submission:</p>
            <div class="card">
                <strong>Submission Update</strong>
                <p><strong>Title:</strong> ${title}<br/><strong>Ref:</strong> ${referenceCode}<br/><strong>New Status:</strong> <span class="badge ${badge}">${statusLabel}</span></p>
            </div>
            ${congratsMsg}
            ${winnerMsg}
            <a href="${APP_URL}/participant" class="btn">View Dashboard →</a>
        `)
        return {
            subject: `📋 Submission Update — ${referenceCode}: ${statusLabel}`,
            html,
            text: `Hi ${name}, your submission "${title}" (${referenceCode}) status is now: ${statusLabel}. View at ${APP_URL}/participant`,
        }
    },

    /** Team invite */
    teamInvite({ inviteeName, teamName, teamLeadName, inviteUrl }: {
        inviteeName: string; teamName: string; teamLeadName: string; inviteUrl: string
    }) {
        const html = baseLayout(`
            <p>Hi <strong>${inviteeName}</strong>,</p>
            <p>You've been invited to join a team for the <strong>TGG Campus Eco-Challenge 2026</strong>!</p>
            <div class="card">
                <strong>Team Invitation</strong>
                <p><strong>Team:</strong> ${teamName}<br/><strong>Invited by:</strong> ${teamLeadName}</p>
            </div>
            <p>Click the button below to accept this invitation. The link expires in 7 days.</p>
            <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
            <hr class="divider" />
            <p class="muted">If you don't recognise this invitation or don't want to join, simply ignore this email.</p>
        `)
        return {
            subject: `👥 You've been invited to join Team "${teamName}"`,
            html,
            text: `Hi ${inviteeName}, you've been invited to join team "${teamName}" by ${teamLeadName}. Accept at: ${inviteUrl}`,
        }
    },

    /** Judge welcome / account creation */
    judgeWelcome({ name, email }: { name: string; email: string }) {
        const html = baseLayout(`
            <p>Hi <strong>${name}</strong>,</p>
            <p>You have been appointed as a <strong>Judge</strong> for the TGG Campus Eco-Challenge 2026. We're honoured to have you on our judging panel.</p>
            <div class="card">
                <strong>Your Login</strong>
                <p><strong>Email:</strong> ${email}</p>
            </div>
            <p>Please set your password using the link below, then log in to access your assigned submissions.</p>
            <a href="${APP_URL}/reset-password" class="btn">Set Password & Log In →</a>
            <hr class="divider" />
            <p class="muted">If you have any questions, please contact the challenge administrator.</p>
        `)
        return {
            subject: '⚖️ You\'re a Judge — TGG Eco-Challenge 2026',
            html,
            text: `Hi ${name}, you've been added as a judge for TGG Eco-Challenge 2026. Set your password at ${APP_URL}/reset-password`,
        }
    },

    /** Coordinator welcome */
    coordinatorWelcome({ name, email, university }: { name: string; email: string; university: string }) {
        const html = baseLayout(`
            <p>Hi <strong>${name}</strong>,</p>
            <p>You have been assigned as the <strong>Campus Coordinator</strong> for <strong>${university}</strong> in the TGG Campus Eco-Challenge 2026.</p>
            <div class="card">
                <strong>Your Account</strong>
                <p><strong>Email:</strong> ${email}<br/><strong>University:</strong> ${university}</p>
            </div>
            <p>Log in to manage participants and track submissions from your campus.</p>
            <a href="${APP_URL}/reset-password" class="btn">Set Password & Log In →</a>
        `)
        return {
            subject: '🏫 Campus Coordinator Account — TGG Eco-Challenge 2026',
            html,
            text: `Hi ${name}, you've been added as Campus Coordinator for ${university}. Set password at ${APP_URL}/reset-password`,
        }
    },
}

// ---------- Send helper ----------

export async function sendEmail({
    to,
    subject,
    html,
    text,
}: {
    to: string
    subject: string
    html: string
    text: string
}): Promise<{ success: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[email] RESEND_API_KEY not set — skipping email send')
        return { success: true } // Gracefully no-op in dev if key is absent
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject,
            html,
            text,
        })
        if (error) return { success: false, error: (error as { message?: string }).message ?? 'Unknown Resend error' }
        return { success: true }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[email] Send failed:', message)
        return { success: false, error: message }
    }
}
