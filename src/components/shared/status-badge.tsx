'use client'

import { SUBMISSION_STATUSES, STATUS_CONFIG, type SubmissionStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: SubmissionStatus
    size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status]
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            )}
            style={{ color: config.color, backgroundColor: config.bgColor }}
        >
            {config.label}
        </span>
    )
}
