'use client'

import { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface WordCounterTextareaProps {
    value: string
    onChange: (value: string) => void
    maxWords: number
    placeholder?: string
    className?: string
    rows?: number
    id?: string
    disabled?: boolean
}

function countWords(text: string): number {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function WordCounterTextarea({
    value,
    onChange,
    maxWords,
    placeholder,
    className,
    rows = 6,
    id,
    disabled,
}: WordCounterTextareaProps) {
    const wordCount = countWords(value)
    const isOverLimit = wordCount > maxWords
    const pct = Math.min((wordCount / maxWords) * 100, 100)

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }, [onChange])

    return (
        <div className="space-y-1">
            <Textarea
                id={id}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className={cn(
                    'text-base resize-none transition-colors',
                    isOverLimit && 'border-red-400 focus-visible:ring-red-400',
                    className
                )}
            />
            <div className="flex items-center justify-between px-1">
                {/* Mini progress bar */}
                <div className="flex-1 h-1 bg-gray-200 rounded-full mr-3 overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-200',
                            isOverLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-[#1a5c38]'
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className={cn(
                    'text-xs font-mono tabular-nums whitespace-nowrap',
                    isOverLimit ? 'text-red-500 font-semibold' : wordCount > maxWords * 0.8 ? 'text-amber-500' : 'text-gray-400'
                )}>
                    {wordCount} / {maxWords} words
                </span>
            </div>
            {isOverLimit && (
                <p className="text-red-500 text-xs">{wordCount - maxWords} words over the limit — please shorten your response.</p>
            )}
        </div>
    )
}
