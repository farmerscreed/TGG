'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users } from 'lucide-react'
import { UNIVERSITY_LABELS } from '@/lib/constants'

interface Participant {
    id: string
    created_at: string
    profiles: {
        first_name: string
        last_name: string
        phone: string
        gender: string
        department: string
        year_of_study: string
        participation_type: string
    } | null
}

export function CoordinatorParticipantsClient({ participants, university }: {
    participants: Participant[]
    university: string
}) {
    const [search, setSearch] = useState('')

    const filtered = participants.filter(p => {
        const q = search.toLowerCase()
        return (
            p.profiles?.first_name?.toLowerCase().includes(q) ||
            p.profiles?.last_name?.toLowerCase().includes(q) ||
            p.profiles?.department?.toLowerCase().includes(q)
        )
    })

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Participants</h1>
                <p className="text-gray-500 text-sm">{UNIVERSITY_LABELS[university as keyof typeof UNIVERSITY_LABELS] ?? university} · {filtered.length} of {participants.length}</p>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                    className="pl-9 h-11"
                    placeholder="Search by name or department…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                    <Users size={40} className="mx-auto" />
                    <p className="text-sm">No participants found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(p => {
                        const full = `${p.profiles?.first_name ?? ''} ${p.profiles?.last_name ?? ''}`.trim()
                        const initials = full ? full.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
                        return (
                            <Card key={p.id}>
                                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="bg-[#1a5c38] text-white text-sm font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-[#1a1a1a]">{full || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{p.profiles?.department} · {p.profiles?.year_of_study}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs capitalize">{p.profiles?.participation_type ?? 'N/A'}</Badge>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
