'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { Search, FileText, ExternalLink, RefreshCw } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/constants'

const STATUSES = ['all', 'draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'disqualified']
const STATUS_LABELS: Record<string, string> = {
    all: 'All', draft: 'Draft', submitted: 'Submitted',
    under_review: 'Under Review', shortlisted: 'Shortlisted', winner: 'Winner', disqualified: 'Disqualified'
}

interface Submission {
    id: string
    reference_code: string
    title: string
    status: string
    category: string
    updated_at: string
    is_locked: boolean
    profiles: { first_name: string; last_name: string; university: string } | null
}

export function AdminSubmissionsClient({
    submissions, currentStatus, searchQ
}: { submissions: Submission[]; currentStatus: string; searchQ: string }) {
    const router = useRouter()
    const [search, setSearch] = useState(searchQ)
    const [status, setStatus] = useState(currentStatus)
    const [updating, setUpdating] = useState<string | null>(null)

    const filtered = submissions.filter(s => {
        const q = search.toLowerCase()
        return (
            s.title?.toLowerCase().includes(q) ||
            s.reference_code?.toLowerCase().includes(q) ||
            s.profiles?.first_name?.toLowerCase().includes(q) ||
            s.profiles?.last_name?.toLowerCase().includes(q)
        )
    })

    const applyFilter = () => {
        const params = new URLSearchParams()
        if (status !== 'all') params.set('status', status)
        if (search) params.set('q', search)
        router.push(`/admin/submissions?${params.toString()}`)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id)
        const supabase = createClient()
        await supabase.from('submissions').update({ status: newStatus }).eq('id', id)

        // Fire status email (best-effort)
        try {
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'status_update',
                    payload: { submissionId: id, status: newStatus },
                }),
            })
        } catch { /* swallow */ }

        router.refresh()
        setUpdating(null)
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Submissions</h1>
                <p className="text-gray-500 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            className="pl-9 h-11"
                            placeholder="Search by title or name…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilter()}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={applyFilter} className="h-10 bg-[#1a5c38] hover:bg-[#154d30] text-white px-4">Filter</Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                    <FileText size={40} className="mx-auto" />
                    <p className="text-sm">No submissions found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(sub => (
                        <Card key={sub.id}>
                            <CardContent className="pt-4 pb-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs text-gray-400">{sub.reference_code}</p>
                                        <p className="font-semibold text-[#1a1a1a] truncate">{sub.title || 'Untitled'}</p>
                                        <p className="text-xs text-gray-500">
                                            {sub.profiles?.first_name} {sub.profiles?.last_name} · {sub.profiles?.university}
                                        </p>
                                        <p className="text-xs text-gray-400">{sub.category}</p>
                                    </div>
                                    <StatusBadge status={sub.status as SubmissionStatus} size="sm" />
                                </div>

                                {/* Quick status update */}
                                <div className="flex gap-2 flex-wrap">
                                    {['under_review', 'shortlisted', 'winner', 'disqualified'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(sub.id, s)}
                                            disabled={updating === sub.id || sub.status === s}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sub.status === s
                                                ? 'bg-[#1a5c38] text-white border-[#1a5c38]'
                                                : 'border-gray-200 text-gray-500 hover:border-[#1a5c38] hover:text-[#1a5c38]'
                                                } disabled:opacity-50`}
                                        >
                                            {updating === sub.id ? <RefreshCw size={10} className="inline animate-spin" /> : null}
                                            {' '}{STATUS_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
