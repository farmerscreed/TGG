import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Award, BarChart2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [
        { count: participantCount },
        { count: submissionCount },
        { count: judgeCount },
        { count: shortlistedCount },
    ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'participant'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).neq('status', 'draft'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'judge'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).in('status', ['shortlisted', 'winner']),
    ])

    const stats = [
        { label: 'Participants', value: participantCount ?? 0, icon: <Users size={22} />, href: '/admin/participants', color: 'text-blue-600 bg-blue-50' },
        { label: 'Submissions', value: submissionCount ?? 0, icon: <FileText size={22} />, href: '/admin/submissions', color: 'text-purple-600 bg-purple-50' },
        { label: 'Judges', value: judgeCount ?? 0, icon: <Award size={22} />, href: '/admin/judges', color: 'text-amber-600 bg-amber-50' },
        { label: 'Shortlisted', value: shortlistedCount ?? 0, icon: <BarChart2 size={22} />, href: '/admin/leaderboard', color: 'text-[#1a5c38] bg-[#e8f5e9]' },
    ]

    const quickLinks = [
        { href: '/admin/submissions', label: 'Review Submissions', desc: 'Score and update submission statuses' },
        { href: '/admin/judges', label: 'Manage Judges', desc: 'Add judges and assign submissions' },
        { href: '/admin/leaderboard', label: 'Leaderboard', desc: 'View rankings and declare winners' },
        { href: '/admin/coordinators', label: 'Coordinators', desc: 'Manage university coordinators' },
        { href: '/admin/settings', label: 'Challenge Settings', desc: 'Configure dates and categories' },
        { href: '/admin/reports', label: 'Reports', desc: 'Export data and analytics' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">Campus Eco-Challenge 2026 · Admin Portal</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {stats.map(s => (
                    <Link key={s.label} href={s.href}>
                        <Card className="hover:border-[#1a5c38]/40 transition-colors h-full">
                            <CardContent className="pt-4 pb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                                    {s.icon}
                                </div>
                                <p className="text-2xl font-bold text-[#1a1a1a]">{s.value}</p>
                                <p className="text-sm text-gray-500">{s.label}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Quick Access</CardTitle></CardHeader>
                <CardContent className="divide-y divide-gray-100">
                    {quickLinks.map(l => (
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
