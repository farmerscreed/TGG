import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import {
    ArrowLeft, User, GraduationCap, Phone, FileText,
    Users, Building2, Calendar, CheckCircle2, Clock
} from 'lucide-react'
import { UNIVERSITY_LABELS } from '@/lib/constants'
import type { SubmissionStatus } from '@/lib/constants'

interface PageProps { params: Promise<{ id: string }> }

export default async function ParticipantDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data } = await supabase.rpc('get_participant_detail', { p_user_id: id })
    if (!data) notFound()

    const p = data as {
        id: string
        created_at: string
        profile: {
            first_name: string
            last_name: string
            email: string
            phone: string
            gender: string
            university: string
            department: string
            year_of_study: string
            participation_type: string
            profile_photo_url: string | null
        }
        submission: {
            id: string
            reference_code: string
            title: string
            category: string
            status: SubmissionStatus
            is_locked: boolean
            current_step: number
            created_at: string
            updated_at: string
        } | null
        team: {
            id: string
            name: string
            member_count: number
        } | null
    }

    const fullName = `${p.profile.first_name} ${p.profile.last_name}`.trim()
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const joinedDate = new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Link href="/admin/participants" className="text-gray-400 hover:text-[#1a5c38] transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">Participant Detail</h1>
                    <p className="text-gray-400 text-xs">Joined {joinedDate}</p>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User size={16} className="text-[#1a5c38]" />
                        Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarFallback className="bg-[#1a5c38] text-white text-xl font-bold">
                                {initials || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-lg font-bold text-[#1a1a1a]">{fullName || '—'}</p>
                            <p className="text-sm text-gray-500">{p.profile.email}</p>
                            <Badge variant="outline" className="mt-1 text-xs capitalize">
                                {p.profile.participation_type || 'Type not set'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                            <Building2 size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">University</p>
                                <p className="font-medium text-[#1a1a1a]">
                                    {UNIVERSITY_LABELS[p.profile.university as keyof typeof UNIVERSITY_LABELS] ?? p.profile.university ?? '—'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <GraduationCap size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Department</p>
                                <p className="font-medium text-[#1a1a1a]">{p.profile.department || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Year of Study</p>
                                <p className="font-medium text-[#1a1a1a]">{p.profile.year_of_study || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Phone</p>
                                <p className="font-medium text-[#1a1a1a]">{p.profile.phone || '—'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submission Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText size={16} className="text-[#1a5c38]" />
                        Submission
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {p.submission ? (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-mono text-xs text-gray-400">{p.submission.reference_code}</p>
                                    <p className="font-semibold text-[#1a1a1a]">{p.submission.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{p.submission.category}</p>
                                </div>
                                <StatusBadge status={p.submission.status} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    {p.submission.is_locked
                                        ? <CheckCircle2 size={13} className="text-green-500" />
                                        : <Clock size={13} className="text-amber-500" />}
                                    {p.submission.is_locked ? 'Submitted & Locked' : `Step ${p.submission.current_step} of 6 in progress`}
                                </div>
                                <div>Last updated: {new Date(p.submission.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                            </div>
                            <Link
                                href={`/admin/submissions?q=${p.submission.reference_code}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#1a5c38] font-medium hover:underline"
                            >
                                View full submission →
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            <FileText size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No submission yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users size={16} className="text-[#1a5c38]" />
                        Team
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {p.team ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-[#1a1a1a]">{p.team.name}</p>
                                <p className="text-xs text-gray-500">{p.team.member_count} member{p.team.member_count !== 1 ? 's' : ''}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">Team</Badge>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Participating individually or no team set</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
