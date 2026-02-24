import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCoordinatorsClient } from './admin-coordinators-client'

export default async function AdminCoordinatorsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: roleCheck } = await supabase
        .from('user_roles').select('role').eq('id', user.id).eq('role', 'admin').single()
    if (!roleCheck) redirect('/admin')

    const { data: coordinators } = await supabase
        .from('user_roles')
        .select(`
            id, university, created_at,
            profiles!user_roles_id_fkey(first_name, last_name)
        `)
        .eq('role', 'coordinator')
        .order('university')

    return <AdminCoordinatorsClient coordinators={(coordinators ?? []) as unknown as never} />
}
