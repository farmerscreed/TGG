import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettingsClient } from './admin-settings-client'

export default async function AdminSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: settings } = await supabase
        .from('challenge_settings')
        .select('*')
        .single()

    const { data: categories } = await supabase
        .from('challenge_categories')
        .select('*')
        .order('name')

    return <AdminSettingsClient settings={settings} categories={categories ?? []} />
}
