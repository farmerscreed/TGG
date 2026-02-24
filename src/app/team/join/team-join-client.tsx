'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Loader2, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Invite {
    id: string
    team_id: string
    status: string
    teams: { name: string; team_lead_id: string } | null
}

interface TeamJoinClientProps {
    userId: string
    userEmail: string
    invite: Invite | null
    token: string
}

export default function TeamJoinClient({ userId, userEmail, invite, token }: TeamJoinClientProps) {
    const router = useRouter()
    const [joining, setJoining] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!invite) {
        return (
            <Card className="w-full max-w-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-3">
                    <UserX className="mx-auto text-red-500" size={40} />
                    <h1 className="text-lg font-bold text-[#1a1a1a]">Invite Not Found</h1>
                    <p className="text-sm text-gray-500">This invite link is invalid or has already been used.</p>
                    <Button onClick={() => router.push('/participant/team')} variant="outline" className="w-full h-11">
                        Go to Team Page
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (invite.status === 'accepted') {
        return (
            <Card className="w-full max-w-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-3">
                    <CheckCircle2 className="mx-auto text-[#1a5c38]" size={40} />
                    <h1 className="text-lg font-bold text-[#1a1a1a]">Already Accepted</h1>
                    <p className="text-sm text-gray-500">You've already joined <strong>{invite.teams?.name}</strong>.</p>
                    <Button onClick={() => router.push('/participant/team')} className="w-full h-11 bg-[#1a5c38] hover:bg-[#154d30] text-white">
                        View My Team
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const handleJoin = async () => {
        setJoining(true)
        setError(null)
        const supabase = createClient()

        // Check user isn't already on another team
        const { data: existingMembership } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'accepted')
            .single()

        if (existingMembership) {
            setError('You are already a member of another team. You must leave that team before joining a new one.')
            setJoining(false)
            return
        }

        const { error: updateError } = await supabase
            .from('team_members')
            .update({ user_id: userId, status: 'accepted' })
            .eq('id', invite.id)
            .eq('invite_token', token)

        if (updateError) {
            setError('Failed to join team. Please try again.')
            setJoining(false)
            return
        }

        setDone(true)
        setJoining(false)
        setTimeout(() => router.push('/participant/team'), 2000)
    }

    if (done) {
        return (
            <Card className="w-full max-w-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-3">
                    <CheckCircle2 className="mx-auto text-[#1a5c38]" size={48} />
                    <h1 className="text-lg font-bold text-[#1a1a1a]">You're in! 🎉</h1>
                    <p className="text-sm text-gray-500">You've joined <strong>{invite.teams?.name}</strong>. Redirecting…</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm">
            <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto text-2xl">👥</div>
                    <h1 className="text-xl font-bold text-[#1a1a1a]">Team Invitation</h1>
                    <p className="text-sm text-gray-500">You've been invited to join</p>
                    <p className="text-lg font-semibold text-[#1a5c38]">{invite.teams?.name}</p>
                    <p className="text-xs text-gray-400">Joining as: {userEmail}</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                    >
                        {joining ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining…</> : 'Accept & Join Team'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/participant')}
                        className="w-full h-11"
                    >
                        Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
