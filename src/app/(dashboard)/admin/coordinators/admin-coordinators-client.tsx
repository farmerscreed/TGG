'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, CheckCircle2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UNIVERSITIES, UNIVERSITY_LABELS } from '@/lib/constants'

interface Coordinator {
    id: string
    university: string
    created_at: string
    profiles: { first_name: string; last_name: string } | null
}

export function AdminCoordinatorsClient({ coordinators: initial }: { coordinators: Coordinator[] }) {
    const router = useRouter()
    const [coordinators, setCoordinators] = useState(initial)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [university, setUniversity] = useState('')
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const createCoordinator = async () => {
        if (!name || !email || !university) return
        setAdding(true)
        setError(null)
        const res = await fetch('/api/admin/create-coordinator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, university }),
        })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error ?? 'Failed to create coordinator')
        } else {
            setSuccess(`Coordinator account created for ${email}`)
            setName('')
            setEmail('')
            setUniversity('')
            router.refresh()
        }
        setAdding(false)
        setTimeout(() => setSuccess(null), 5000)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Campus Coordinators</h1>
                <p className="text-gray-500 text-sm">{coordinators.length} coordinator{coordinators.length !== 1 ? 's' : ''}</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && (
                <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                    <CheckCircle2 size={14} className="text-[#1a5c38]" />
                    <AlertDescription className="text-[#1a5c38] ml-2">{success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader><CardTitle className="text-base">Add Coordinator</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Input placeholder="Full name" className="h-11" value={name} onChange={e => setName(e.target.value)} />
                    <Input placeholder="Email address" type="email" className="h-11" value={email} onChange={e => setEmail(e.target.value)} />
                    <Select value={university} onValueChange={setUniversity}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Assign university" /></SelectTrigger>
                        <SelectContent>
                            {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{UNIVERSITY_LABELS[u]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={createCoordinator}
                        disabled={adding || !name || !email || !university}
                        className="w-full h-11 bg-[#1a5c38] hover:bg-[#154d30] text-white"
                    >
                        {adding ? <><Loader2 className="animate-spin mr-2" size={16} />Creating…</> : <><Plus size={16} className="mr-2" />Create Coordinator</>}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users size={16} />Coordinators</CardTitle></CardHeader>
                <CardContent>
                    {coordinators.length === 0
                        ? <p className="text-sm text-gray-400 text-center py-6">No coordinators yet</p>
                        : (
                            <div className="divide-y divide-gray-100">
                                {coordinators.map(c => {
                                    const full = `${c.profiles?.first_name ?? ''} ${c.profiles?.last_name ?? ''}`.trim()
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 py-3">
                                            <Avatar className="w-9 h-9">
                                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                                    {full.slice(0, 2).toUpperCase() || 'CC'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{full || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">{UNIVERSITY_LABELS[c.university as keyof typeof UNIVERSITY_LABELS] ?? c.university}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{c.university}</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                </CardContent>
            </Card>
        </div>
    )
}
