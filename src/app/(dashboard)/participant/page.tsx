import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubmissionStatusTracker } from '@/components/shared/status-tracker'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowRight, FileText, Users, User, Bell } from 'lucide-react'
import Link from 'next/link'
import type { SubmissionStatus } from '@/lib/constants'

export default async function ParticipantDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: profile }, { data: submission }, { data: team }, { data: notifications }] = await Promise.all([
        supabase.from('profiles').select('*, user_id').eq('user_id', user.id).single(),
        supabase.from('submissions').select('*').eq('user_id', user.id).single(),
        supabase.from('teams').select('*, team_members(*)').eq('lead_user_id', user.id).single(),
        supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    ])

    const profileComplete = !!(
        profile?.first_name && profile?.last_name && profile?.phone &&
        profile?.gender && profile?.university && profile?.department && profile?.year_of_study
    )

    const missingFields = []
    if (!profile?.phone) missingFields.push('Phone number')
    if (!profile?.gender) missingFields.push('Gender')
    if (!profile?.department) missingFields.push('Department')
    if (!profile?.participation_type) missingFields.push('Participation type (individual/team)')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">
                    Welcome back, {profile?.first_name ?? 'Participant'} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Campus Eco-Challenge 2026 · {profile?.university ?? ''}
                </p>
            </div>

            {/* Profile incomplete warning */}
            {!profileComplete && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                        <div className="flex gap-3">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="font-medium text-amber-800 text-sm">Complete your profile</p>
                                <p className="text-amber-600 text-xs mt-1">Missing: {missingFields.join(', ')}</p>
                                <Link href="/participant/profile">
                                    <Button size="sm" className="mt-3 h-9 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                                        Complete Profile →
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notifications */}
            {notifications && notifications.length > 0 && (
                <Card className="border-[#1a5c38]/20 bg-[#e8f5e9]">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold text-[#1a5c38] flex items-center gap-2">
                            <Bell size={16} />
                            New Notifications ({notifications.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                        {notifications.map((n) => (
                            <div key={n.id} className="bg-white rounded-lg px-3 py-2.5">
                                <p className="text-sm font-medium text-[#1a1a1a]">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Submission Status */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-[#1a1a1a] flex items-center justify-between">
                        <span>Your Submission</span>
                        {submission && (
                            <StatusBadge status={submission.status as SubmissionStatus} size="sm" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {submission ? (
                        <>
                            <div className="px-2">
                                <SubmissionStatusTracker currentStatus={submission.status} />
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-xs text-gray-500 font-medium">Reference Code</p>
                                <p className="font-mono font-bold text-[#1a5c38] text-lg">{submission.reference_code}</p>
                                {submission.title && (
                                    <>
                                        <p className="text-xs text-gray-500 font-medium mt-2">Project Title</p>
                                        <p className="font-medium text-[#1a1a1a] text-sm">{submission.title}</p>
                                    </>
                                )}
                            </div>

                            {submission.status === 'draft' && (
                                <Link href="/participant/submission">
                                    <Button className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white text-base font-semibold">
                                        <FileText className="mr-2" size={18} />
                                        Continue Submission
                                        <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </Link>
                            )}

                            {submission.status === 'not_selected' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                    <p className="text-red-700 font-medium text-sm">Submission not selected this round.</p>
                                    <p className="text-red-500 text-xs mt-1">Thank you for participating in Eco-Challenge 2026!</p>
                                </div>
                            )}

                            {submission.status === 'winner' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                    <p className="text-2xl mb-2">🏆</p>
                                    <p className="text-green-700 font-bold text-base">Congratulations! You're a winner!</p>
                                    {submission.winner_position && (
                                        <Badge className="mt-2 bg-[#1a5c38] text-white">{submission.winner_position} Place</Badge>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto">
                                <FileText className="text-[#1a5c38]" size={28} />
                            </div>
                            <div>
                                <p className="font-semibold text-[#1a1a1a]">No submission yet</p>
                                <p className="text-gray-500 text-sm mt-1">Start your project submission today</p>
                            </div>
                            <Link href="/participant/submission">
                                <Button className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white text-base font-semibold">
                                    Start Submission
                                    <ArrowRight className="ml-2" size={18} />
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/participant/profile">
                    <Card className="hover:border-[#1a5c38]/40 transition-colors cursor-pointer h-full">
                        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                                <User className="text-[#1a5c38]" size={20} />
                            </div>
                            <p className="font-medium text-sm text-[#1a1a1a]">My Profile</p>
                            <p className="text-xs text-gray-500">View & edit your details</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/participant/team">
                    <Card className="hover:border-[#1a5c38]/40 transition-colors cursor-pointer h-full">
                        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                                <Users className="text-[#1a5c38]" size={20} />
                            </div>
                            <p className="font-medium text-sm text-[#1a1a1a]">My Team</p>
                            <p className="text-xs text-gray-500">
                                {team ? `${(team.team_members as unknown[])?.length ?? 0} member(s)` : 'Create or join a team'}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
