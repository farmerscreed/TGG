'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Loader2, UserPlus, Users, Copy, CheckCircle2, Crown, Info } from 'lucide-react'
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface TeamMember {
    id: string
    invited_email: string
    status: string
    invite_token: string
    user_id: string | null
}

interface Team {
    id: string
    name: string
    lead_user_id: string
    university: string
    team_members: TeamMember[]
}

interface TeamClientProps {
    userId: string
    userEmail: string
    university: string
    participationType: string
    team: Record<string, unknown> | null
}

export function TeamClient({ userId, userEmail, university, participationType, team }: TeamClientProps) {
    const router = useRouter()
    const [teamName, setTeamName] = useState('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [creating, setCreating] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    const currentTeam = team as Team | null
    const isLead = currentTeam?.lead_user_id === userId
    const members: TeamMember[] = currentTeam?.team_members ?? []
    const acceptedCount = members.filter(m => m.status === 'accepted').length + (isLead ? 1 : 0)

    const handleCreateTeam = async () => {
        if (!teamName.trim()) { setError('Please enter a team name.'); return }
        setCreating(true)
        setError(null)
        const supabase = createClient()
        const { error: createError } = await supabase.from('teams').insert({
            name: teamName.trim(),
            lead_user_id: userId,
            university: university,
        })
        if (createError) {
            setError('Failed to create team. ' + createError.message)
        } else {
            router.refresh()
        }
        setCreating(false)
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim()) { setError('Enter an email to invite.'); return }
        if (acceptedCount >= MAX_TEAM_SIZE) { setError(`Maximum team size is ${MAX_TEAM_SIZE}.`); return }
        setInviting(true)
        setError(null)
        const supabase = createClient()
        const { error: inviteError } = await supabase.from('team_members').insert({
            team_id: currentTeam!.id,
            invited_email: inviteEmail.trim(),
            status: 'invited',
        })
        if (inviteError) {
            setError('Invite failed: ' + inviteError.message)
        } else {
            setInviteEmail('')
            router.refresh()
        }
        setInviting(false)
    }

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/team/join?token=${token}`
        navigator.clipboard.writeText(url)
        setCopied(token)
        setTimeout(() => setCopied(null), 2000)
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            invited: 'bg-amber-100 text-amber-700',
            accepted: 'bg-green-100 text-green-700',
            declined: 'bg-red-100 text-red-700',
        }
        return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    if (participationType !== 'team') {
        return (
            <div className="space-y-5">
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Team Management</h1>
                <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                    <Info className="text-[#1a5c38]" size={16} />
                    <AlertDescription className="text-[#1a5c38] ml-2 text-sm">
                        You are registered as an <strong>individual</strong> participant. To form a team, update your participation type in your profile first.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Team Management</h1>
                <p className="text-gray-500 text-sm mt-0.5">Teams can have {MIN_TEAM_SIZE}–{MAX_TEAM_SIZE} members</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            {!currentTeam ? (
                /* No team yet */
                <Card>
                    <CardHeader><CardTitle className="text-base">Create Your Team</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="team_name">Team Name *</Label>
                            <Input
                                id="team_name"
                                className="h-12 text-base"
                                placeholder="e.g. Green Pioneers"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleCreateTeam}
                            disabled={creating}
                            className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                        >
                            {creating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating…</> : <><Users className="mr-2" size={18} />Create Team</>}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Has team */
                <>
                    <Card className="border-[#1a5c38]/30">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-lg text-[#1a1a1a]">{currentTeam.name}</h2>
                                    <p className="text-sm text-gray-500">{currentTeam.university} · {acceptedCount}/{MAX_TEAM_SIZE} members</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                                    <Users className="text-[#1a5c38]" size={22} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members list */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>Members</span>
                                <span className="text-sm font-normal text-gray-500">{acceptedCount} of {MAX_TEAM_SIZE}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Lead */}
                            <div className="flex items-center gap-3 py-1">
                                <Avatar className="w-9 h-9">
                                    <AvatarFallback className="bg-[#1a5c38] text-white text-sm font-bold">
                                        {userEmail[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{userEmail}</p>
                                    <p className="text-xs text-gray-400">Team Lead</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Crown size={14} className="text-amber-500" />
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Accepted</span>
                                </div>
                            </div>

                            {members.map((m, idx) => (
                                <div key={m.id}>
                                    {idx === 0 && <Separator />}
                                    <div className="flex items-center gap-3 py-2">
                                        <Avatar className="w-9 h-9">
                                            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-bold">
                                                {m.invited_email[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#1a1a1a] truncate">{m.invited_email}</p>
                                            <p className="text-xs text-gray-400">Member</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {statusBadge(m.status)}
                                            {m.status === 'invited' && isLead && (
                                                <button
                                                    onClick={() => copyInviteLink(m.invite_token)}
                                                    className="text-gray-400 hover:text-[#1a5c38] p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                                    title="Copy invite link"
                                                >
                                                    {copied === m.invite_token ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {idx < members.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Invite */}
                    {isLead && acceptedCount < MAX_TEAM_SIZE && (
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus size={18} />Invite Member</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="invite_email">Email Address</Label>
                                    <Input
                                        id="invite_email"
                                        type="email"
                                        className="h-12 text-base"
                                        placeholder="teammate@university.edu"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={handleInvite}
                                    disabled={inviting}
                                    className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                                >
                                    {inviting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending Invite…</> : 'Send Invite'}
                                </Button>
                                <p className="text-xs text-gray-400 text-center">
                                    An invite link will be generated. Share it or copy it from the members list above.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {acceptedCount >= MAX_TEAM_SIZE && (
                        <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                            <AlertDescription className="text-[#1a5c38] text-sm">
                                ✅ Your team is full ({MAX_TEAM_SIZE}/{MAX_TEAM_SIZE} members).
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}
        </div>
    )
}
