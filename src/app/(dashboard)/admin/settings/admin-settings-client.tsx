'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, Loader2, Settings, Tag, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Settings {
    id: string
    registration_open: string | null
    registration_close: string | null
    submission_open: string | null
    submission_deadline: string | null
    judging_start: string | null
    judging_end: string | null
    results_date: string | null
    judging_locked: boolean
}

interface Category {
    id: string
    name: string
    description: string | null
}

function dtLocal(val: string | null) {
    if (!val) return ''
    return val.slice(0, 16) // ISO → datetime-local
}

export function AdminSettingsClient({ settings, categories: initialCats }: {
    settings: Settings | null
    categories: Category[]
}) {
    const router = useRouter()
    const [form, setForm] = useState({
        registration_open: dtLocal(settings?.registration_open ?? null),
        registration_close: dtLocal(settings?.registration_close ?? null),
        submission_open: dtLocal(settings?.submission_open ?? null),
        submission_deadline: dtLocal(settings?.submission_deadline ?? null),
        judging_start: dtLocal(settings?.judging_start ?? null),
        judging_end: dtLocal(settings?.judging_end ?? null),
        results_date: dtLocal(settings?.results_date ?? null),
        judging_locked: settings?.judging_locked ?? false,
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>(initialCats)
    const [newCat, setNewCat] = useState('')
    const [newCatDesc, setNewCatDesc] = useState('')
    const [addingCat, setAddingCat] = useState(false)

    const set = (k: string) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

    const saveSettings = async () => {
        setSaving(true)
        setError(null)
        const supabase = createClient()
        const { error: e } = await supabase
            .from('challenge_settings')
            .update({
                ...form,
                registration_open: form.registration_open || null,
                registration_close: form.registration_close || null,
                submission_open: form.submission_open || null,
                submission_deadline: form.submission_deadline || null,
                judging_start: form.judging_start || null,
                judging_end: form.judging_end || null,
                results_date: form.results_date || null,
            })
            .eq('id', settings?.id ?? '')
        if (e) { setError(e.message); setSaving(false); return }
        setSaved(true)
        setSaving(false)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
    }

    const addCategory = async () => {
        if (!newCat.trim()) return
        setAddingCat(true)
        const supabase = createClient()
        const { data, error: e } = await supabase
            .from('challenge_categories')
            .insert({ name: newCat.trim(), description: newCatDesc.trim() || null })
            .select()
            .single()
        if (!e && data) {
            setCategories(c => [...c, data])
            setNewCat('')
            setNewCatDesc('')
        }
        setAddingCat(false)
    }

    const deleteCategory = async (id: string) => {
        const supabase = createClient()
        await supabase.from('challenge_categories').delete().eq('id', id)
        setCategories(c => c.filter(cat => cat.id !== id))
    }

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">Challenge Settings</h1>
                <p className="text-gray-500 text-sm">Configure dates, categories, and judging controls</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {saved && (
                <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                    <CheckCircle2 size={16} className="text-[#1a5c38]" />
                    <AlertDescription className="text-[#1a5c38] ml-2">Settings saved!</AlertDescription>
                </Alert>
            )}

            {/* Dates */}
            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings size={16} /> Key Dates</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { key: 'registration_open', label: 'Registration Opens' },
                        { key: 'registration_close', label: 'Registration Closes' },
                        { key: 'submission_open', label: 'Submission Opens' },
                        { key: 'submission_deadline', label: 'Submission Deadline' },
                        { key: 'judging_start', label: 'Judging Starts' },
                        { key: 'judging_end', label: 'Judging Ends' },
                        { key: 'results_date', label: 'Results Announcement' },
                    ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={key}>{label}</Label>
                            <Input
                                id={key}
                                type="datetime-local"
                                className="h-11"
                                value={form[key as keyof typeof form] as string}
                                onChange={e => set(key)(e.target.value)}
                            />
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                            <p className="text-sm font-medium">Lock Judging</p>
                            <p className="text-xs text-gray-400">Prevent judges from submitting scores</p>
                        </div>
                        <Switch
                            checked={form.judging_locked}
                            onCheckedChange={v => set('judging_locked')(v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={saveSettings}
                disabled={saving}
                className="w-full h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
            >
                {saving ? <><Loader2 className="animate-spin mr-2" size={16} />Saving…</> : 'Save Settings'}
            </Button>

            {/* Categories */}
            <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag size={16} /> Challenge Categories</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{cat.name}</p>
                                    {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                                </div>
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <Input
                            placeholder="New category name"
                            className="h-11"
                            value={newCat}
                            onChange={e => setNewCat(e.target.value)}
                        />
                        <Input
                            placeholder="Description (optional)"
                            className="h-10"
                            value={newCatDesc}
                            onChange={e => setNewCatDesc(e.target.value)}
                        />
                        <Button
                            onClick={addCategory}
                            disabled={addingCat || !newCat.trim()}
                            variant="outline"
                            className="w-full h-10 border-[#1a5c38] text-[#1a5c38]"
                        >
                            {addingCat ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} className="mr-1" />}
                            Add Category
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
