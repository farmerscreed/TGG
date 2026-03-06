import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowLeft, FileText, User, ExternalLink, Star } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/constants'
import { AdminSubmissionDetailActions } from './admin-submission-detail-actions'

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminSubmissionDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [
        { data: sub },
        { data: files },
        { data: scores },
    ] = await Promise.all([
        supabase
            .from('submissions')
            .select(`
                id, reference_code, title, category, custom_category, status, is_locked,
                problem_statement, proposed_solution, innovation_approach, expected_impact,
                video_link, created_at, updated_at,
                profiles!submissions_profile_user_fkey(first_name, last_name, university)
            `)
            .eq('id', id)
            .single(),
        supabase
            .from('submission_files')
            .select('id, file_name, file_url, file_type')
            .eq('submission_id', id),
        supabase
            .from('judging_scores')
            .select('id, total_score, comments, judge_id, created_at')
            .eq('submission_id', id),
    ])

    if (!sub) notFound()

    const profile = sub.profiles as unknown as { first_name: string; last_name: string; university: string } | null
    const submitterName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '—'

    const avgScore = scores && scores.length > 0
        ? (scores.reduce((a, s) => a + (s.total_score ?? 0), 0) / scores.length).toFixed(1)
        : null

    const fields = [
        { label: 'Problem Statement', value: sub.problem_statement },
        { label: 'Proposed Solution', value: sub.proposed_solution },
        { label: 'Innovation Approach', value: sub.innovation_approach },
        { label: 'Expected Impact', value: sub.expected_impact },
    ]

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Link href="/admin/submissions" className="text-gray-400 hover:text-[#1a5c38] transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-400">{sub.reference_code}</p>
                    <h1 className="text-xl font-bold text-[#1a1a1a] truncate">{sub.title || 'Untitled'}</h1>
                </div>
                <StatusBadge status={sub.status as SubmissionStatus} />
            </div>

            {/* Meta */}
            <Card>
                <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{submitterName}</span>
                        {profile?.university && <span className="text-gray-400">· {profile.university}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{sub.category}{sub.custom_category ? ` — ${sub.custom_category}` : ''}</span>
                    </div>
                    {avgScore && (
                        <div className="flex items-center gap-2 text-sm">
                            <Star size={14} className="text-amber-500 flex-shrink-0" />
                            <span className="text-gray-600">Avg score: <strong className="text-[#1a5c38]">{avgScore}/100</strong> from {scores!.length} judge{scores!.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status actions */}
            <AdminSubmissionDetailActions submissionId={sub.id} currentStatus={sub.status} />

            {/* Content fields */}
            {fields.map(({ label, value }) => (
                <Card key={label}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">{label}</CardTitle></CardHeader>
                    <CardContent>
                        {value
                            ? <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{value}</p>
                            : <p className="text-sm text-gray-400 italic">Not provided</p>
                        }
                    </CardContent>
                </Card>
            ))}

            {/* Video */}
            {sub.video_link && (
                <a
                    href={sub.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#1a5c38] font-medium bg-[#e8f5e9] px-4 py-3 rounded-xl hover:bg-[#c8e6c9] transition-colors"
                >
                    <ExternalLink size={16} />
                    Watch Demo Video
                </a>
            )}

            {/* Files */}
            {(files ?? []).length > 0 && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Supporting Files</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {files!.map(f => (
                            <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border hover:border-[#1a5c38] transition-colors">
                                <FileText size={16} className="text-[#1a5c38] flex-shrink-0" />
                                <span className="text-sm truncate">{f.file_name}</span>
                                <ExternalLink size={12} className="text-gray-400 flex-shrink-0 ml-auto" />
                            </a>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Judge scores */}
            {(scores ?? []).length > 0 && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Judge Scores</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {scores!.map((s, i) => (
                            <div key={s.id} className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400">Judge {i + 1}</p>
                                    {s.comments && <p className="text-sm text-gray-600 mt-0.5 italic">"{s.comments}"</p>}
                                </div>
                                <Badge className="bg-[#e8f5e9] text-[#1a5c38] text-sm font-bold flex-shrink-0">
                                    {(s.total_score ?? 0).toFixed(1)}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
