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

    const { email, name, university } = await request.json()
    if (!email || !name || !university) {
        return NextResponse.json({ error: 'email, name, and university are required' }, { status: 400 })
    }

    // Create the user account
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
    })

    if (createError) {
        if (createError.message.includes('already')) {
            return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 })
        }
        return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const coordId = newUser.user.id

    // Assign coordinator role
    await supabase.from('user_roles').upsert({ id: coordId, role: 'coordinator', university })

    // Create profile
    const nameParts = name.trim().split(' ')
    await supabase.from('profiles').upsert({
        id: coordId,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
    })

    // Send welcome email
    await sendEmail({
        to: email,
        ...emailTemplates.coordinatorWelcome({ name, email, university }),
    })

    return NextResponse.json({ success: true, userId: coordId })
}
