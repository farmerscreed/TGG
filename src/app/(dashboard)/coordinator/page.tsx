import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Users, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function CoordinatorDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: roleData } = await supabase.from('user_roles').select('university').eq('id', user.id).single()
    const university = roleData?.university ?? ''

    const [{ count: partCount }, { count: subCount }] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'participant').eq('university', university),
        supabase.from('submissions').select('user_roles!inner(*)', { count: 'exact', head: true }).neq('status', 'draft'),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Coordinator Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">{university} · Campus Eco-Challenge 2026</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                            <Users size={22} className="text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-[#1a1a1a]">{partCount ?? 0}</p>
                        <p className="text-sm text-gray-500">Participants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] flex items-center justify-center mb-3">
                            <FileText size={22} className="text-[#1a5c38]" />
                        </div>
                        <p className="text-2xl font-bold text-[#1a1a1a]">{subCount ?? 0}</p>
                        <p className="text-sm text-gray-500">Submissions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Quick Access</CardTitle></CardHeader>
                <CardContent className="divide-y divide-gray-100">
                    {[
                        { href: '/coordinator/participants', label: 'Participants', desc: `View ${university} participants` },
                        { href: '/coordinator/submissions', label: 'Submissions', desc: 'Review and track submission progress' },
                    ].map(l => (
                        <Link key={l.href} href={l.href} className="flex items-center justify-between py-3 hover:text-[#1a5c38] group">
                            <div>
                                <p className="font-medium text-sm text-[#1a1a1a] group-hover:text-[#1a5c38]">{l.label}</p>
                                <p className="text-xs text-gray-400">{l.desc}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-[#1a5c38]" />
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
