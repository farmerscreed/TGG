'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users, ChevronRight } from 'lucide-react'
import { UNIVERSITIES, UNIVERSITY_LABELS } from '@/lib/constants'
import Link from 'next/link'

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
        university: string
    } | null
}

export function AdminParticipantsClient({
    participants, currentUniversity, searchQ
}: { participants: Participant[]; currentUniversity: string; searchQ: string }) {
    const [search, setSearch] = useState(searchQ)
    const [university, setUniversity] = useState(currentUniversity)

    const filtered = participants.filter(p => {
        const q = search.toLowerCase()
        const matchName = (
            p.profiles?.first_name?.toLowerCase().includes(q) ||
            p.profiles?.last_name?.toLowerCase().includes(q) ||
            p.profiles?.department?.toLowerCase().includes(q)
        )
        const matchUni = university === 'all' || p.profiles?.university === university
        return (q === '' || matchName) && matchUni
    })

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Participants</h1>
                <p className="text-gray-500 text-sm">{filtered.length} of {participants.length} registered participants</p>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        className="pl-9 h-11"
                        placeholder="Search by name or department…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={university} onValueChange={setUniversity}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="All universities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Universities</SelectItem>
                        {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{UNIVERSITY_LABELS[u]}</SelectItem>)}
                    </SelectContent>
                </Select>
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
                        const uniLabel = UNIVERSITY_LABELS[p.profiles?.university as keyof typeof UNIVERSITY_LABELS] ?? p.profiles?.university ?? '—'
                        const partType = p.profiles?.participation_type
                        return (
                            <Link key={p.id} href={`/admin/participants/${p.id}`}>
                                <Card className="hover:border-[#1a5c38]/40 hover:shadow-sm transition-all cursor-pointer">
                                    <CardContent className="pt-3 pb-3 flex items-center gap-3">
                                        <Avatar className="w-10 h-10 flex-shrink-0">
                                            <AvatarFallback className="bg-[#1a5c38] text-white text-sm font-bold">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-[#1a1a1a]">{full || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">
                                                {p.profiles?.department ? `${p.profiles.department} · ` : ''}{p.profiles?.year_of_study ?? ''}
                                            </p>
                                            <p className="text-xs text-gray-400">{uniLabel}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge
                                                variant={partType ? 'secondary' : 'outline'}
                                                className={`text-xs capitalize ${partType ? 'bg-[#e8f5e9] text-[#1a5c38] border-0' : 'text-gray-400'}`}
                                            >
                                                {partType || 'Profile incomplete'}
                                            </Badge>
                                            <ChevronRight size={16} className="text-gray-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
