import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText, Lock } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import type { SubmissionStatus } from '@/lib/constants'

export default async function JudgeDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: settings } = await supabase.from('challenge_settings').select('judging_locked').single()
    const isLocked = settings?.judging_locked ?? false

    const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('submission_id, submissions(id, reference_code, title, status, category)')
        .eq('judge_id', user.id)

    const submissionsToJudge = assignments?.map(a => a.submissions) ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Judge Dashboard</h1>
                <p className="text-gray-500 text-sm mt-0.5">Campus Eco-Challenge 2026</p>
            </div>

            {isLocked && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 pb-4 flex items-center gap-3">
                        <Lock className="text-red-500 flex-shrink-0" size={20} />
                        <p className="text-sm text-red-700 font-medium">Judging is currently locked by admin.</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>Assigned Submissions</span>
                        <Badge variant="outline">{submissionsToJudge.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {submissionsToJudge.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 space-y-2">
                            <FileText size={36} className="mx-auto" />
                            <p className="text-sm">No submissions assigned yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {(submissionsToJudge as unknown as { id: string; reference_code: string; title: string; status: string; category: string }[]).map(sub => (
                                <Link key={sub.id} href={`/judge/score/${sub.id}`}
                                    className="flex items-center justify-between py-3 hover:text-[#1a5c38] group">
                                    <div>
                                        <p className="font-mono text-xs text-gray-400">{sub.reference_code}</p>
                                        <p className="font-medium text-sm text-[#1a1a1a] group-hover:text-[#1a5c38]">{sub.title || 'Untitled'}</p>
                                        <p className="text-xs text-gray-400">{sub.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={sub.status as SubmissionStatus} size="sm" />
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-[#1a5c38]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
