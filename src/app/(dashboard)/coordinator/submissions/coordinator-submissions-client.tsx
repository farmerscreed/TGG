'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { UNIVERSITY_LABELS } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/constants'

interface Submission {
    id: string
    reference_code: string
    title: string
    category: string
    status: string
    updated_at: string
    profiles: { first_name: string; last_name: string; university: string } | null
}

export function CoordinatorSubmissionsClient({ submissions, university }: {
    submissions: Submission[]
    university: string
}) {
    const [search, setSearch] = useState('')

    const filtered = submissions.filter(s => {
        const q = search.toLowerCase()
        return (
            s.title?.toLowerCase().includes(q) ||
            s.reference_code?.toLowerCase().includes(q) ||
            (s.profiles as { first_name?: string } | null)?.first_name?.toLowerCase().includes(q) ||
            (s.profiles as { last_name?: string } | null)?.last_name?.toLowerCase().includes(q)
        )
    })

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Submissions</h1>
                <p className="text-gray-500 text-sm">{UNIVERSITY_LABELS[university as keyof typeof UNIVERSITY_LABELS] ?? university} · {filtered.length} of {submissions.length}</p>
            </div>

            <div className="relative">
                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                    className="pl-9 h-11"
                    placeholder="Search by title or name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                    <FileText size={40} className="mx-auto" />
                    <p className="text-sm">No submissions found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(sub => (
                        <Card key={sub.id}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs text-gray-400">{sub.reference_code}</p>
                                        <p className="font-semibold text-sm text-[#1a1a1a] truncate">{sub.title || 'Untitled'}</p>
                                        <p className="text-xs text-gray-500">
                                            {(sub.profiles as { first_name?: string } | null)?.first_name}{' '}
                                            {(sub.profiles as { last_name?: string } | null)?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-400">{sub.category}</p>
                                    </div>
                                    <StatusBadge status={sub.status as SubmissionStatus} size="sm" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
