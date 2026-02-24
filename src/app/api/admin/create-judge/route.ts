import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single()

    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { email, name } = await request.json()
    if (!email || !name) return NextResponse.json({ error: 'email and name are required' }, { status: 400 })

    // Use Supabase admin API to create user and send password reset
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
    })

    if (createError) {
        // User might already exist
        if (createError.message.includes('already')) {
            return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 })
        }
        return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const judgeId = newUser.user.id

    // Assign judge role
    await supabase.from('user_roles').upsert({
        id: judgeId,
        role: 'judge',
        university: null,
    })

    // Create profile
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''
    await supabase.from('profiles').upsert({
        id: judgeId,
        first_name: firstName,
        last_name: lastName,
    })

    // Send password setup link via Supabase
    await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
    })

    // Send welcome email via Resend
    const emailResult = await sendEmail({
        to: email,
        ...emailTemplates.judgeWelcome({ name, email }),
    })

    if (!emailResult.success) {
        console.warn('Email send failed:', emailResult.error)
    }

    return NextResponse.json({ success: true, userId: judgeId })
}
