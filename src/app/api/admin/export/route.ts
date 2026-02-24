import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .in('role', ['admin', 'coordinator'])
        .single()
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'submissions'
    const university = searchParams.get('university') ?? null

    if (type === 'participants') {
        let query = supabase
            .from('user_roles')
            .select(`
                id, university, created_at,
                profiles!user_roles_id_fkey(first_name, last_name, phone, gender, department, year_of_study, participation_type)
            `)
            .eq('role', 'participant')
            .order('created_at', { ascending: false })

        // Coordinators can only export their own university
        if (role.role === 'coordinator' || university) {
            const uni = university ?? (await supabase
                .from('user_roles').select('university').eq('id', user.id).single()).data?.university
            if (uni) query = query.eq('university', uni)
        }

        const { data } = await query
        if (!data) return NextResponse.json({ error: 'No data' }, { status: 404 })

        const csvRows = [
            ['First Name', 'Last Name', 'University', 'Department', 'Year', 'Type', 'Phone', 'Gender', 'Registered At'],
            ...data.map(p => [
                (p.profiles as { first_name?: string } | null)?.first_name ?? '',
                (p.profiles as { last_name?: string } | null)?.last_name ?? '',
                p.university,
                (p.profiles as { department?: string } | null)?.department ?? '',
                (p.profiles as { year_of_study?: string } | null)?.year_of_study ?? '',
                (p.profiles as { participation_type?: string } | null)?.participation_type ?? '',
                (p.profiles as { phone?: string } | null)?.phone ?? '',
                (p.profiles as { gender?: string } | null)?.gender ?? '',
                new Date(p.created_at).toLocaleDateString(),
            ]),
        ]

        const csv = csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="tgg-participants.csv"',
            },
        })
    }

    // Default: submissions
    let query = supabase
        .from('submissions')
        .select(`
            reference_code, title, category, status, created_at, updated_at,
            profiles!submissions_user_id_fkey(first_name, last_name, university)
        `)
        .order('updated_at', { ascending: false })

    if (role.role === 'coordinator' || university) {
        // Filter by university via profile join (handled below)
    }

    const { data } = await query.limit(1000)
    const filtered = (data ?? []).filter(s =>
        !university || (s.profiles as { university?: string } | null)?.university === university
    )

    const csvRows = [
        ['Reference', 'Title', 'Category', 'Status', 'Submitter', 'University', 'Submitted', 'Last Updated'],
        ...filtered.map(s => [
            s.reference_code,
            s.title,
            s.category,
            s.status,
            `${(s.profiles as { first_name?: string } | null)?.first_name ?? ''} ${(s.profiles as { last_name?: string } | null)?.last_name ?? ''}`.trim(),
            (s.profiles as { university?: string } | null)?.university ?? '',
            new Date(s.created_at).toLocaleDateString(),
            new Date(s.updated_at).toLocaleDateString(),
        ]),
    ]

    const csv = csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="tgg-submissions.csv"',
        },
    })
}
