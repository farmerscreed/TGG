'use client'

import { SUBMISSION_STEPS } from '@/lib/constants'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubmissionStatusTrackerProps {
    currentStatus: string
    submissionStep?: number
}

const STATUS_ORDER = ['draft', 'submitted', 'under_review', 'shortlisted', 'winner']

const STATUS_STEPS = [
    { key: 'draft', label: 'Draft', description: 'Working on your submission' },
    { key: 'submitted', label: 'Submitted', description: 'Awaiting review' },
    { key: 'under_review', label: 'Under Review', description: 'Being evaluated' },
    { key: 'shortlisted', label: 'Shortlisted', description: 'You made the cut!' },
    { key: 'winner', label: 'Winner / Finalist', description: 'Results announced' },
]

export function SubmissionStatusTracker({ currentStatus }: SubmissionStatusTrackerProps) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)

    return (
        <div className="relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                <div
                    className="h-full bg-[#1a5c38] transition-all duration-500"
                    style={{ width: `${Math.min((currentIndex / (STATUS_ORDER.length - 1)) * 100, 100)}%` }}
                />
            </div>

            <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex
                    const isCurrent = idx === currentIndex
                    const isNotSelected = currentStatus === 'not_selected'

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors',
                                isCompleted ? 'bg-[#1a5c38] text-white' :
                                    isCurrent ? (isNotSelected ? 'bg-red-500 text-white' : 'bg-[#1a5c38] text-white ring-4 ring-[#e8f5e9]') :
                                        'bg-gray-200 text-gray-400'
                            )}>
                                {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </div>
                            <div className="text-center">
                                <p className={cn(
                                    'text-xs font-medium leading-tight',
                                    (isCompleted || isCurrent) ? 'text-[#1a5c38]' : 'text-gray-400'
                                )}>
                                    {step.label}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
