import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .single()

  const roleRedirects: Record<string, string> = {
    admin: '/admin',
    coordinator: '/coordinator',
    judge: '/judge',
    participant: '/participant',
  }

  redirect(roleRedirects[roleData?.role ?? 'participant'] ?? '/login')
}
