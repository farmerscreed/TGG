import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, Users, FileText, Award, Download } from 'lucide-react'
import Link from 'next/link'

export default async function AdminReportsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [
        { count: totalParticipants },
        { count: totalSubmissions },
        { count: draftCount },
        { count: submittedCount },
        { count: underReviewCount },
        { count: shortlistedCount },
        { count: winnerCount },
        { count: disqualifiedCount },
        { data: byCategory },
        { data: byUniversity },
    ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'participant'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'winner'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'disqualified'),
        supabase.from('submissions').select('category').neq('status', 'draft'),
        supabase.from('profiles').select('university').not('university', 'is', null),
    ])

    // Aggregate by category
    const categoryMap = new Map<string, number>()
    byCategory?.forEach(s => {
        const cat = s.category || 'Uncategorised'
        categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)
    })
    const categories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])

    // Aggregate by university
    const uniMap = new Map<string, number>()
    byUniversity?.forEach(p => {
        const uni = p.university || 'Unknown'
        uniMap.set(uni, (uniMap.get(uni) ?? 0) + 1)
    })
    const universities = Array.from(uniMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)

    const statusBreakdown = [
        { label: 'Draft', value: draftCount ?? 0, color: 'bg-gray-200 text-gray-600' },
        { label: 'Submitted', value: submittedCount ?? 0, color: 'bg-blue-100 text-blue-700' },
        { label: 'Under Review', value: underReviewCount ?? 0, color: 'bg-yellow-100 text-yellow-700' },
        { label: 'Shortlisted', value: shortlistedCount ?? 0, color: 'bg-purple-100 text-purple-700' },
        { label: 'Winner', value: winnerCount ?? 0, color: 'bg-[#e8f5e9] text-[#1a5c38]' },
        { label: 'Disqualified', value: disqualifiedCount ?? 0, color: 'bg-red-100 text-red-700' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">Reports</h1>
                    <p className="text-gray-500 text-sm">Analytics and data export</p>
                </div>
                <Link
                    href="/api/admin/export"
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5c38] text-white text-sm font-medium rounded-xl hover:bg-[#154d30] transition-colors"
                >
                    <Download size={16} />
                    Export CSV
                </Link>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                            <Users size={22} />
                        </div>
                        <p className="text-2xl font-bold text-[#1a1a1a]">{totalParticipants ?? 0}</p>
                        <p className="text-sm text-gray-500">Participants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                            <FileText size={22} />
                        </div>
                        <p className="text-2xl font-bold text-[#1a1a1a]">{totalSubmissions ?? 0}</p>
                        <p className="text-sm text-gray-500">Total Submissions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status breakdown */}
            <Card>
                <CardHeader><CardTitle className="text-base">Submissions by Status</CardTitle></CardHeader>
                <CardContent className="space-y-2 pb-4">
                    {statusBreakdown.map(s => (
                        <div key={s.label} className="flex items-center justify-between">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                            <span className="font-semibold text-sm text-[#1a1a1a]">{s.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* By category */}
            {categories.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 size={16} />By Category</CardTitle></CardHeader>
                    <CardContent className="space-y-2 pb-4">
                        {categories.map(([cat, count]) => (
                            <div key={cat} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 truncate flex-1 mr-3">{cat}</span>
                                <span className="font-semibold text-sm text-[#1a1a1a] flex-shrink-0">{count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* By university */}
            {universities.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award size={16} />Top Universities</CardTitle></CardHeader>
                    <CardContent className="space-y-2 pb-4">
                        {universities.map(([uni, count]) => (
                            <div key={uni} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 truncate flex-1 mr-3">{uni}</span>
                                <span className="font-semibold text-sm text-[#1a1a1a] flex-shrink-0">{count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
