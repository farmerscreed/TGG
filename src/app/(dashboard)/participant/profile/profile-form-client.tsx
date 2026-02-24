'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Loader2, Camera, CheckCircle2, User } from 'lucide-react'
import { UNIVERSITIES, UNIVERSITY_LABELS, GENDERS, YEARS_OF_STUDY } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface ProfileFormClientProps {
    userId: string
    userEmail: string
    profile: Record<string, string> | null
    role: string
}

export function ProfileFormClient({ userId, userEmail, profile, role }: ProfileFormClientProps) {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        phone: profile?.phone ?? '',
        gender: profile?.gender ?? '',
        university: profile?.university ?? '',
        department: profile?.department ?? '',
        year_of_study: profile?.year_of_study ?? '',
        participation_type: profile?.participation_type ?? '',
        profile_photo_url: profile?.profile_photo_url ?? '',
    })

    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [photoUrl, setPhotoUrl] = useState<string>(profile?.profile_photo_url ?? '')

    const set = (key: string) => (value: string) => setForm(f => ({ ...f, [key]: value }))

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }

        setUploadingPhoto(true)
        const supabase = createClient()
        const path = `${userId}/${Date.now()}.${file.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true })

        if (uploadError) {
            setError('Photo upload failed')
            setUploadingPhoto(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)
        setPhotoUrl(publicUrl)
        setForm(f => ({ ...f, profile_photo_url: publicUrl }))
        setUploadingPhoto(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(false)
        const supabase = createClient()

        const { error: upsertError } = await supabase.from('profiles').upsert({
            user_id: userId,
            ...form,
        })

        if (upsertError) {
            setError('Failed to save profile. Please try again.')
            setSaving(false)
            return
        }

        setSuccess(true)
        setSaving(false)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
    }

    const initials = form.first_name && form.last_name
        ? `${form.first_name[0]}${form.last_name[0]}`.toUpperCase()
        : '?'

    return (
        <div className="space-y-5 max-w-lg">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">My Profile</h1>
                <p className="text-gray-500 text-sm mt-0.5 capitalize">{role} · {userEmail}</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && (
                <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                    <CheckCircle2 className="text-[#1a5c38]" size={16} />
                    <AlertDescription className="text-[#1a5c38] ml-2">Profile saved successfully!</AlertDescription>
                </Alert>
            )}

            {/* Photo */}
            <Card>
                <CardContent className="pt-6 pb-5">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={photoUrl} alt="Profile photo" />
                                <AvatarFallback className="bg-[#1a5c38] text-white text-xl font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#1a5c38] text-white flex items-center justify-center shadow-md border-2 border-white"
                            >
                                {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                            </button>
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png" capture="user" onChange={handlePhotoUpload} className="hidden" />
                        </div>
                        <div>
                            <p className="font-semibold text-[#1a1a1a]">{form.first_name || 'Your'} {form.last_name || 'Name'}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{userEmail}</p>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="text-xs text-[#1a5c38] font-medium mt-1.5 hover:underline"
                            >
                                Change photo
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input id="first_name" className="h-12" value={form.first_name} onChange={e => set('first_name')(e.target.value)} placeholder="Ada" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input id="last_name" className="h-12" value={form.last_name} onChange={e => set('last_name')(e.target.value)} placeholder="Okonkwo" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" className="h-12" value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="08012345678" />
                    </div>

                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={form.gender} onValueChange={set('gender')}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent>
                                {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Academic Info */}
            <Card>
                <CardHeader><CardTitle className="text-base">Academic Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>University</Label>
                        <Select value={form.university} onValueChange={set('university')}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Select your university" /></SelectTrigger>
                            <SelectContent>
                                {UNIVERSITIES.map(u => <SelectItem key={u} value={u}>{UNIVERSITY_LABELS[u]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department">Department / Faculty</Label>
                        <Input id="department" className="h-12" value={form.department} onChange={e => set('department')(e.target.value)} placeholder="e.g. Environmental Science" />
                    </div>

                    <div className="space-y-2">
                        <Label>Year of Study</Label>
                        <Select value={form.year_of_study} onValueChange={set('year_of_study')}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Select year" /></SelectTrigger>
                            <SelectContent>
                                {YEARS_OF_STUDY.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Participation Type</Label>
                        <Select value={form.participation_type} onValueChange={set('participation_type')}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Individual or Team?" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">You can change this up until you submit your entry.</p>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base font-semibold bg-[#1a5c38] hover:bg-[#154d30] text-white"
            >
                {saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving…</> : 'Save Profile'}
            </Button>
        </div>
    )
}
