import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { SubmissionStatus } from '@/lib/constants'

export default async function AdminLeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get scored submissions ordered by average score descending
    const { data: scores } = await supabase
        .from('judging_scores')
        .select('submission_id, total_score')
        .order('total_score', { ascending: false })

    // Group by submission, average the scores
    const submissionScores = new Map<string, number[]>()
    scores?.forEach(s => {
        if (!submissionScores.has(s.submission_id)) submissionScores.set(s.submission_id, [])
        submissionScores.get(s.submission_id)!.push(s.total_score)
    })

    const ranked = Array.from(submissionScores.entries())
        .map(([id, sc]) => ({
            id,
            avg: sc.reduce((a, b) => a + b, 0) / sc.length,
            count: sc.length,
        }))
        .sort((a, b) => b.avg - a.avg)

    // Fetch submission details
    const ids = ranked.map(r => r.id)
    const { data: submissions } = ids.length > 0
        ? await supabase
            .from('submissions')
            .select('id, reference_code, title, status, category, profiles!submissions_user_id_fkey(first_name, last_name, university)')
            .in('id', ids)
        : { data: [] }

    const subMap = new Map((submissions ?? []).map(s => [s.id, s]))

    const leaderboard = ranked.map((r, idx) => ({
        rank: idx + 1,
        ...r,
        sub: subMap.get(r.id),
    }))

    const rankIcon = (rank: number) => {
        if (rank === 1) return <Trophy size={20} className="text-yellow-500" />
        if (rank === 2) return <Medal size={20} className="text-gray-400" />
        if (rank === 3) return <Award size={20} className="text-amber-600" />
        return <span className="text-sm font-bold text-gray-400 w-5 text-center">{rank}</span>
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Leaderboard</h1>
                <p className="text-gray-500 text-sm">{leaderboard.length} scored submissions</p>
            </div>

            {leaderboard.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-400">
                        <Trophy size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No scores submitted yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {leaderboard.map(({ rank, avg, count, sub }) => (
                        <Card key={rank} className={rank <= 3 ? 'border-[#1a5c38]/30' : ''}>
                            <CardContent className="pt-4 pb-4 flex items-center gap-4">
                                <div className="w-8 flex items-center justify-center flex-shrink-0">
                                    {rankIcon(rank)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-xs text-gray-400">{sub?.reference_code ?? '—'}</p>
                                    <p className="font-semibold text-sm text-[#1a1a1a] truncate">{sub?.title ?? 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">
                                        {(sub?.profiles as { first_name?: string; last_name?: string } | null)?.first_name}{' '}
                                        {(sub?.profiles as { first_name?: string; last_name?: string } | null)?.last_name}
                                        {' · '}{sub?.category}
                                    </p>
                                    <p className="text-xs text-gray-400">{count} judge{count !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-bold text-[#1a5c38]">{avg.toFixed(1)}</p>
                                    <StatusBadge status={(sub?.status as SubmissionStatus) ?? 'submitted'} size="sm" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
