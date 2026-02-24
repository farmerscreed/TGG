'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Users, Loader2, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Judge {
    id: string
    created_at: string
    profiles: { first_name: string; last_name: string } | null
}

interface Submission {
    id: string
    reference_code: string
    title: string
    category: string
}

interface Assignment {
    id: string
    judge_id: string
    submission_id: string
}

export function AdminJudgesClient({ judges, submissions, assignments: initialAssignments }: {
    judges: Judge[]
    submissions: Submission[]
    assignments: Assignment[]
}) {
    const router = useRouter()
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
    const [newJudgeEmail, setNewJudgeEmail] = useState('')
    const [newJudgeName, setNewJudgeName] = useState('')
    const [addingJudge, setAddingJudge] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [selectedJudge, setSelectedJudge] = useState('')
    const [selectedSubmission, setSelectedSubmission] = useState('')
    const [assigning, setAssigning] = useState(false)

    const createJudge = async () => {
        if (!newJudgeEmail.trim() || !newJudgeName.trim()) return
        setAddingJudge(true)
        setError(null)

        const res = await fetch('/api/admin/create-judge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newJudgeEmail.trim(), name: newJudgeName.trim() }),
        })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error ?? 'Failed to create judge')
        } else {
            setSuccess(`Judge account created for ${newJudgeEmail}. An email has been sent.`)
            setNewJudgeEmail('')
            setNewJudgeName('')
            router.refresh()
        }
        setAddingJudge(false)
        setTimeout(() => setSuccess(null), 5000)
    }

    const addAssignment = async () => {
        if (!selectedJudge || !selectedSubmission) return
        const already = assignments.find(a => a.judge_id === selectedJudge && a.submission_id === selectedSubmission)
        if (already) { setError('This assignment already exists.'); return }

        setAssigning(true)
        const supabase = createClient()
        const { data, error: e } = await supabase
            .from('judge_assignments')
            .insert({ judge_id: selectedJudge, submission_id: selectedSubmission })
            .select('id, judge_id, submission_id')
            .single()
        if (e) { setError(e.message); setAssigning(false); return }
        setAssignments(a => [...a, data])
        setSelectedJudge('')
        setSelectedSubmission('')
        setAssigning(false)
    }

    const removeAssignment = async (id: string) => {
        const supabase = createClient()
        await supabase.from('judge_assignments').delete().eq('id', id)
        setAssignments(a => a.filter(ai => ai.id !== id))
    }

    const getJudgeName = (id: string) => {
        const j = judges.find(j => j.id === id)
        return j ? `${j.profiles?.first_name ?? ''} ${j.profiles?.last_name ?? ''}`.trim() || 'Unknown' : 'Unknown'
    }

    const getSubTitle = (id: string) => {
        const s = submissions.find(s => s.id === id)
        return s ? s.title || s.reference_code : 'Unknown'
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Judge Management</h1>
                <p className="text-gray-500 text-sm">{judges.length} judge{judges.length !== 1 ? 's' : ''} registered</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]"><AlertDescription className="text-[#1a5c38]">{success}</AlertDescription></Alert>}

            {/* Create Judge */}
            <Card>
                <CardHeader><CardTitle className="text-base">Add New Judge</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Input placeholder="Full name" className="h-11" value={newJudgeName} onChange={e => setNewJudgeName(e.target.value)} />
                    <Input placeholder="Email address" type="email" className="h-11" value={newJudgeEmail} onChange={e => setNewJudgeEmail(e.target.value)} />
                    <Button
                        onClick={createJudge}
                        disabled={addingJudge || !newJudgeEmail || !newJudgeName}
                        className="w-full h-11 bg-[#1a5c38] hover:bg-[#154d30] text-white"
                    >
                        {addingJudge ? <><Loader2 className="animate-spin mr-2" size={16} />Creating…</> : <><Plus size={16} className="mr-2" />Create Judge Account</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Judges List */}
            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award size={16} />Judges</CardTitle></CardHeader>
                <CardContent>
                    {judges.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-4">No judges yet</p>
                        : (
                            <div className="divide-y divide-gray-100">
                                {judges.map(j => {
                                    const full = `${j.profiles?.first_name ?? ''} ${j.profiles?.last_name ?? ''}`.trim()
                                    const cnt = assignments.filter(a => a.judge_id === j.id).length
                                    return (
                                        <div key={j.id} className="flex items-center gap-3 py-3">
                                            <Avatar className="w-9 h-9">
                                                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-bold">
                                                    {full.slice(0, 2).toUpperCase() || 'JG'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{full || 'Unknown'}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{cnt} assigned</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                </CardContent>
            </Card>

            {/* Assign Submissions */}
            <Card>
                <CardHeader><CardTitle className="text-base">Assign Submission to Judge</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Select value={selectedJudge} onValueChange={setSelectedJudge}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select judge" /></SelectTrigger>
                        <SelectContent>
                            {judges.map(j => (
                                <SelectItem key={j.id} value={j.id}>
                                    {`${j.profiles?.first_name ?? ''} ${j.profiles?.last_name ?? ''}`.trim() || 'Unknown'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedSubmission} onValueChange={setSelectedSubmission}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select submission" /></SelectTrigger>
                        <SelectContent>
                            {submissions.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.reference_code} — {s.title || 'Untitled'}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={addAssignment}
                        disabled={assigning || !selectedJudge || !selectedSubmission}
                        variant="outline"
                        className="w-full h-11 border-[#1a5c38] text-[#1a5c38]"
                    >
                        {assigning ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-1" />} Assign
                    </Button>
                </CardContent>
            </Card>

            {/* Current Assignments */}
            {assignments.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Current Assignments</CardTitle></CardHeader>
                    <CardContent>
                        <div className="divide-y divide-gray-100">
                            {assignments.map(a => (
                                <div key={a.id} className="flex items-center gap-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{getJudgeName(a.judge_id)}</p>
                                        <p className="text-xs text-gray-400 truncate">{getSubTitle(a.submission_id)}</p>
                                    </div>
                                    <button
                                        onClick={() => removeAssignment(a.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
