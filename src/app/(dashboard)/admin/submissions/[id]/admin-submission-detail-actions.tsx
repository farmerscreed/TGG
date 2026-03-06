'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

const STATUSES = ['under_review', 'shortlisted', 'winner', 'disqualified']
const STATUS_LABELS: Record<string, string> = {
    under_review: 'Under Review', shortlisted: 'Shortlisted', winner: 'Winner', disqualified: 'Disqualified'
}

export function AdminSubmissionDetailActions({
    submissionId, currentStatus
}: { submissionId: string; currentStatus: string }) {
    const router = useRouter()
    const [updating, setUpdating] = useState(false)

    const updateStatus = async (newStatus: string) => {
        setUpdating(true)
        const supabase = createClient()
        await supabase.from('submissions').update({ status: newStatus }).eq('id', submissionId)
        try {
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'status_update', payload: { submissionId, status: newStatus } }),
            })
        } catch { /* swallow */ }
        router.refresh()
        setUpdating(false)
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
                <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updating || currentStatus === s}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${currentStatus === s
                        ? 'bg-[#1a5c38] text-white border-[#1a5c38]'
                        : 'border-gray-200 text-gray-500 hover:border-[#1a5c38] hover:text-[#1a5c38]'
                        } disabled:opacity-50`}
                >
                    {updating && currentStatus !== s ? <RefreshCw size={10} className="inline animate-spin mr-1" /> : null}
                    {STATUS_LABELS[s]}
                </button>
            ))}
        </div>
    )
}
