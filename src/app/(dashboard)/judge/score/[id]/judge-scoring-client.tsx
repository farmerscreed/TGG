'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Loader2, Lock, Star, ExternalLink, FileText } from 'lucide-react'

interface Submission {
    id: string
    reference_code: string
    title: string
    category: string
    problem_statement: string
    proposed_solution: string
    innovation_approach: string
    expected_impact: string
    video_link: string
    status: string
}

interface Criterion {
    id: string
    name: string
    description: string
    max_score: number
    weight: number
}

interface ExistingScores {
    id: string
    scores: Record<string, number>
    comments: string
    total_score: number
}

interface SubmissionFile {
    id: string
    file_name: string
    file_url: string
    file_type: string
}

export function JudgeScoringClient({
    submission, files, criteria, existingScores, judgeId, isLocked
}: {
    submission: Submission
    files: SubmissionFile[]
    criteria: Criterion[]
    existingScores: ExistingScores | null
    judgeId: string
    isLocked: boolean
}) {
    const router = useRouter()
    const [scores, setScores] = useState<Record<string, number>>(existingScores?.scores ?? {})
    const [comments, setComments] = useState(existingScores?.comments ?? '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<string>('submission')

    const setScore = (criterionId: string, score: number) => {
        setScores(s => ({ ...s, [criterionId]: score }))
    }

    const totalScore = criteria.reduce((acc, c) => {
        const s = scores[c.id] ?? 0
        return acc + (s / c.max_score) * c.weight
    }, 0)

    const allScored = criteria.every(c => scores[c.id] !== undefined)

    const handleSave = async (submit = false) => {
        if (submit && !allScored) { setError('Please score all criteria before submitting.'); return }
        setSaving(true)
        setError(null)
        const supabase = createClient()

        const payload = {
            submission_id: submission.id,
            judge_id: judgeId,
            scores,
            comments,
            total_score: totalScore,
        }

        if (existingScores?.id) {
            await supabase.from('judging_scores').update(payload).eq('id', existingScores.id)
        } else {
            await supabase.from('judging_scores').insert(payload)
        }

        setSaving(false)
        if (submit) {
            router.push('/judge')
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
    }

    const sections = [
        { id: 'submission', label: 'Submission' },
        { id: 'scoring', label: 'Scoring' },
    ]

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{submission.reference_code}</span>
                    <Badge variant="outline" className="text-xs">{submission.category}</Badge>
                    {isLocked && (
                        <Badge className="bg-red-100 text-red-600 text-xs flex items-center gap-1"><Lock size={10} />Locked</Badge>
                    )}
                </div>
                <h1 className="text-xl font-bold text-[#1a1a1a]">{submission.title || 'Untitled Submission'}</h1>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === s.id ? 'bg-white text-[#1a5c38] shadow-sm' : 'text-gray-500'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Submission Content */}
            {activeSection === 'submission' && (
                <div className="space-y-4">
                    {[
                        { label: 'Problem Statement', value: submission.problem_statement },
                        { label: 'Proposed Solution', value: submission.proposed_solution },
                        { label: 'Innovation Approach', value: submission.innovation_approach },
                        { label: 'Expected Impact', value: submission.expected_impact },
                    ].map(({ label, value }) => (
                        <Card key={label}>
                            <CardHeader><CardTitle className="text-sm text-gray-600">{label}</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{value || <span className="text-gray-400 italic">Not provided</span>}</p>
                            </CardContent>
                        </Card>
                    ))}

                    {submission.video_link && (
                        <a href={submission.video_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#1a5c38] font-medium bg-[#e8f5e9] px-4 py-3 rounded-lg hover:bg-[#c8e6c9] transition-colors">
                            <ExternalLink size={16} />
                            Watch Demo Video
                        </a>
                    )}

                    {files.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-sm text-gray-600">Supporting Files</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {files.map(f => (
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

                    <Button
                        onClick={() => setActiveSection('scoring')}
                        className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                    >
                        Proceed to Scoring →
                    </Button>
                </div>
            )}

            {/* Scoring */}
            {activeSection === 'scoring' && (
                <div className="space-y-4">
                    {isLocked && (
                        <Alert className="border-red-200 bg-red-50">
                            <Lock size={14} className="text-red-500" />
                            <AlertDescription className="text-red-700 ml-2 text-sm">Judging is locked by admin. Scores cannot be edited.</AlertDescription>
                        </Alert>
                    )}

                    {/* Score total */}
                    <Card className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[#1a5c38]">Total Score</span>
                                <span className="text-2xl font-bold text-[#1a5c38]">{totalScore.toFixed(1)}<span className="text-sm font-normal">/100</span></span>
                            </div>
                            <Progress value={totalScore} className="h-2 [&>div]:bg-[#1a5c38]" />
                        </CardContent>
                    </Card>

                    {/* Criteria */}
                    {criteria.map(c => {
                        const score = scores[c.id] ?? 0
                        return (
                            <Card key={c.id}>
                                <CardContent className="pt-4 pb-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-sm text-[#1a1a1a]">{c.name}</p>
                                            <p className="text-xs text-gray-500">{c.description}</p>
                                            <p className="text-xs text-gray-400">Weight: {c.weight}% · Max: {c.max_score} pts</p>
                                        </div>
                                        <span className={`text-lg font-bold flex-shrink-0 ${score > 0 ? 'text-[#1a5c38]' : 'text-gray-300'}`}>
                                            {score}/{c.max_score}
                                        </span>
                                    </div>

                                    {/* Star rating */}
                                    <div className="flex gap-1 flex-wrap">
                                        {Array.from({ length: c.max_score }, (_, i) => i + 1).map(v => (
                                            <button
                                                key={v}
                                                disabled={isLocked}
                                                onClick={() => setScore(c.id, v)}
                                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${score >= v
                                                    ? 'bg-[#1a5c38] text-white'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-[#e8f5e9] hover:text-[#1a5c38]'
                                                    } disabled:opacity-50`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {/* Comments */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Comments (Optional)</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Any feedback or notes for the admin (not shared with participants)…"
                                rows={4}
                                value={comments}
                                onChange={e => setComments(e.target.value)}
                                disabled={isLocked}
                                className="resize-none"
                            />
                        </CardContent>
                    </Card>

                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    {saved && (
                        <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                            <CheckCircle2 size={14} className="text-[#1a5c38]" />
                            <AlertDescription className="text-[#1a5c38] ml-2">Progress saved!</AlertDescription>
                        </Alert>
                    )}

                    {!isLocked && (
                        <div className="space-y-2 pb-4">
                            <Button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                variant="outline"
                                className="w-full h-12 border-[#1a5c38] text-[#1a5c38]"
                            >
                                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Save Progress
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={saving || !allScored}
                                className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                            >
                                {saving ? <><Loader2 className="animate-spin mr-2" size={16} />Submitting…</> : '✓ Submit Scores'}
                            </Button>
                            {!allScored && (
                                <p className="text-xs text-center text-gray-400">Score all criteria to submit</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
