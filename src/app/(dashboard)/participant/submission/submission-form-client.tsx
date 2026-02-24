'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { WordCounterTextarea } from '@/components/shared/word-counter-textarea'
import { FileUpload } from '@/components/shared/file-upload'
import {
    CheckCircle2, ChevronLeft, ChevronRight, Loader2,
    AlertCircle, Clock, Lock, Info
} from 'lucide-react'
import { SUBMISSION_STEPS, WORD_LIMITS, AUTOSAVE_INTERVAL_MS } from '@/lib/constants'

interface SubmissionFormClientProps {
    userId: string
    userEmail: string
    existingSubmission: Record<string, unknown> | null
    existingFiles: Record<string, unknown>[]
    categories: { id: string; name: string }[]
    profile: { participation_type?: string; university?: string } | null
    isOpen: boolean
    deadlineText: string | null
}

const TOTAL_STEPS = 6

export function SubmissionFormClient({
    userId,
    userEmail,
    existingSubmission,
    existingFiles,
    categories,
    profile,
    isOpen,
    deadlineText,
}: SubmissionFormClientProps) {
    const router = useRouter()
    const sub = existingSubmission as Record<string, string> | null
    const isLocked = Boolean(sub?.is_locked) || sub?.status === 'submitted'

    const [step, setStep] = useState(sub?.current_step ? parseInt(sub.current_step as string) : 1)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [submissionId, setSubmissionId] = useState<string | null>((sub?.id as string) ?? null)

    const [formData, setFormData] = useState({
        title: (sub?.title as string) ?? '',
        category: (sub?.category as string) ?? '',
        custom_category: (sub?.custom_category as string) ?? '',
        problem_statement: (sub?.problem_statement as string) ?? '',
        proposed_solution: (sub?.proposed_solution as string) ?? '',
        innovation_approach: (sub?.innovation_approach as string) ?? '',
        expected_impact: (sub?.expected_impact as string) ?? '',
        video_link: (sub?.video_link as string) ?? '',
    })

    const [uploadedFiles, setUploadedFiles] = useState<Record<string, unknown>[]>(existingFiles)
    const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const set = (key: string) => (value: string) => setFormData(fd => ({ ...fd, [key]: value }))

    const saveProgress = useCallback(async () => {
        setSaving(true)
        setSaveStatus('saving')
        const supabase = createClient()

        const payload = {
            user_id: userId,
            ...formData,
            current_step: step,
            status: 'draft',
        }

        let id = submissionId
        if (!id) {
            const { data, error: createError } = await supabase
                .from('submissions')
                .insert({ ...payload, reference_code: '' })
                .select('id')
                .single()
            if (createError || !data) {
                setSaveStatus('error')
                setSaving(false)
                return
            }
            id = data.id
            setSubmissionId(id)
        } else {
            const { error: updateError } = await supabase
                .from('submissions')
                .update(payload)
                .eq('id', id)
            if (updateError) {
                setSaveStatus('error')
                setSaving(false)
                return
            }
        }

        setSaveStatus('saved')
        setSaving(false)
        setTimeout(() => setSaveStatus('idle'), 3000)
    }, [userId, formData, step, submissionId])

    // Autosave
    useEffect(() => {
        if (isLocked) return
        autoSaveRef.current = setInterval(saveProgress, AUTOSAVE_INTERVAL_MS)
        return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
    }, [saveProgress, isLocked])

    const handleNext = async () => {
        if (!isLocked) await saveProgress()
        setStep(s => Math.min(s + 1, TOTAL_STEPS))
    }

    const handleBack = () => setStep(s => Math.max(s - 1, 1))

    const handleSubmit = async () => {
        setError(null)
        if (!submissionId) { setError('Please save your progress first.'); return }
        if (!formData.title.trim()) { setError('Please enter a project title.'); return }
        if (!formData.category) { setError('Please select a category.'); return }
        if (!formData.problem_statement.trim()) { setError('Problem statement is required.'); return }
        if (!formData.proposed_solution.trim()) { setError('Proposed solution is required.'); return }
        if (!formData.expected_impact.trim()) { setError('Expected impact is required.'); return }

        setSubmitting(true)
        const supabase = createClient()
        const { error: submitError, data: updated } = await supabase
            .from('submissions')
            .update({ ...formData, status: 'submitted', is_locked: true, current_step: TOTAL_STEPS })
            .eq('id', submissionId)
            .select('reference_code')
            .single()
        if (submitError) {
            setError('Submission failed. Please try again.')
            setSubmitting(false)
            return
        }

        // Fire confirmation email (best-effort, don't block navigation)
        try {
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userEmail,
                    type: 'submission_received',
                    payload: {
                        referenceCode: updated?.reference_code ?? '',
                        title: formData.title,
                    },
                }),
            })
        } catch {
            // Swallow email errors — don't block
        }

        setSubmitting(false)
        router.push('/participant?submitted=1')
    }

    const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

    if (!isOpen && !sub) {
        return (
            <div className="text-center py-12 space-y-4">
                <Clock className="mx-auto text-gray-400" size={48} />
                <h2 className="text-xl font-bold text-[#1a1a1a]">Submissions not yet open</h2>
                {deadlineText && <p className="text-gray-500 text-sm">Submissions open until: {deadlineText}</p>}
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a]">My Submission</h1>
                    {sub?.reference_code && (
                        <p className="text-sm text-gray-500 mt-0.5 font-mono">{sub.reference_code as string}</p>
                    )}
                </div>
                {isLocked && (
                    <Badge className="bg-[#1a5c38]/10 text-[#1a5c38] flex items-center gap-1.5 px-3 py-1.5">
                        <Lock size={14} /> Submitted
                    </Badge>
                )}
            </div>

            {/* Step progress */}
            <Card className="overflow-hidden">
                <div className="bg-[#1a5c38] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">
                            Step {step} of {TOTAL_STEPS}: {SUBMISSION_STEPS[step - 1].label}
                        </span>
                        <span className="text-white/60 text-xs">{Math.round(progressPct)}% complete</span>
                    </div>
                    <Progress value={progressPct} className="h-1.5 bg-white/20 [&>div]:bg-white" />
                </div>

                {/* Step dots */}
                <div className="px-4 py-3 flex justify-between">
                    {SUBMISSION_STEPS.map((s, idx) => (
                        <button
                            key={s.step}
                            onClick={() => !isLocked && setStep(s.step)}
                            className="flex flex-col items-center gap-1 group"
                            disabled={isLocked}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > idx + 1 ? 'bg-[#1a5c38] text-white' :
                                step === idx + 1 ? 'bg-[#1a5c38] text-white ring-4 ring-[#e8f5e9]' :
                                    'bg-gray-200 text-gray-400 group-hover:bg-gray-300'
                                }`}>
                                {step > idx + 1 ? <CheckCircle2 size={14} /> : s.step}
                            </div>
                            <span className="hidden md:block text-[10px] text-gray-400 leading-tight max-w-[60px] text-center">{s.label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Auto-save indicator */}
            {!isLocked && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    {saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving…</>}
                    {saveStatus === 'saved' && <><CheckCircle2 size={12} className="text-green-500" /> Saved</>}
                    {saveStatus === 'error' && <><AlertCircle size={12} className="text-red-500" /> Save failed</>}
                    {saveStatus === 'idle' && <><Info size={12} /> Auto-saves every 60 seconds</>}
                </div>
            )}

            {isLocked && (
                <Alert className="border-[#1a5c38]/30 bg-[#e8f5e9]">
                    <AlertDescription className="text-[#1a5c38] text-sm flex items-center gap-2">
                        <Lock size={14} /> Your submission has been locked. Contact a coordinator if you need changes.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* STEP 1: Project Basics */}
            {step === 1 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Project Basics</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Title *</Label>
                            <Input
                                id="title"
                                className="h-12 text-base"
                                placeholder="Give your project a clear, descriptive title"
                                value={formData.title}
                                onChange={e => setFormData(fd => ({ ...fd, title: e.target.value }))}
                                disabled={isLocked}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={formData.category} onValueChange={set('category')} disabled={isLocked}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select a challenge category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.category === 'Other' && (
                            <div className="space-y-2">
                                <Label htmlFor="custom_category">Specify Category *</Label>
                                <Input
                                    id="custom_category"
                                    className="h-12 text-base"
                                    placeholder="Describe your category"
                                    value={formData.custom_category}
                                    onChange={e => setFormData(fd => ({ ...fd, custom_category: e.target.value }))}
                                    disabled={isLocked}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: The Problem */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">The Problem</CardTitle>
                        <p className="text-sm text-gray-500">Clearly describe the environmental problem your project addresses.</p>
                    </CardHeader>
                    <CardContent>
                        <WordCounterTextarea
                            id="problem_statement"
                            value={formData.problem_statement}
                            onChange={set('problem_statement')}
                            maxWords={WORD_LIMITS.problem_statement}
                            placeholder="What environmental problem are you solving? Describe the current situation, who is affected, and why it matters…"
                            rows={10}
                            disabled={isLocked}
                        />
                    </CardContent>
                </Card>
            )}

            {/* STEP 3: Your Solution */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Your Solution</CardTitle>
                        <p className="text-sm text-gray-500">Describe your proposed solution and what makes it innovative.</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Proposed Solution *</Label>
                            <WordCounterTextarea
                                value={formData.proposed_solution}
                                onChange={set('proposed_solution')}
                                maxWords={WORD_LIMITS.proposed_solution}
                                placeholder="How does your solution address the problem? What are the key features and components?"
                                rows={10}
                                disabled={isLocked}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Innovation Approach</Label>
                            <WordCounterTextarea
                                value={formData.innovation_approach}
                                onChange={set('innovation_approach')}
                                maxWords={WORD_LIMITS.innovation_approach}
                                placeholder="What makes your approach novel or different from existing solutions?"
                                rows={6}
                                disabled={isLocked}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 4: Expected Impact */}
            {step === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Expected Impact</CardTitle>
                        <p className="text-sm text-gray-500">What difference will your project make?</p>
                    </CardHeader>
                    <CardContent>
                        <WordCounterTextarea
                            value={formData.expected_impact}
                            onChange={set('expected_impact')}
                            maxWords={WORD_LIMITS.expected_impact}
                            placeholder="Describe the expected environmental, social, and economic impact. Include timelines and measurable outcomes if possible…"
                            rows={10}
                            disabled={isLocked}
                        />
                    </CardContent>
                </Card>
            )}

            {/* STEP 5: Supporting Materials */}
            {step === 5 && submissionId && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Documents</CardTitle>
                            <p className="text-sm text-gray-500">Upload supporting documents (max 3, PDF/Word/PPT, up to 10MB each)</p>
                        </CardHeader>
                        <CardContent>
                            <FileUpload
                                type="document"
                                submissionId={submissionId}
                                userId={userId}
                                existingFiles={uploadedFiles.filter(f => (f as Record<string, string>).file_type === 'document') as never}
                                onFilesChange={files => setUploadedFiles(prev => [
                                    ...prev.filter(f => (f as Record<string, string>).file_type === 'image'),
                                    ...files as never[]
                                ])}
                                disabled={isLocked}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Photos / Images</CardTitle>
                            <p className="text-sm text-gray-500">Upload project photos (max 5, JPG/PNG, up to 5MB each)</p>
                        </CardHeader>
                        <CardContent>
                            <FileUpload
                                type="image"
                                submissionId={submissionId}
                                userId={userId}
                                existingFiles={uploadedFiles.filter(f => (f as Record<string, string>).file_type === 'image') as never}
                                onFilesChange={files => setUploadedFiles(prev => [
                                    ...prev.filter(f => (f as Record<string, string>).file_type === 'document'),
                                    ...files as never[]
                                ])}
                                disabled={isLocked}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Video Link (Optional)</CardTitle>
                            <p className="text-sm text-gray-500">Paste a YouTube or Google Drive link to a demo video</p>
                        </CardHeader>
                        <CardContent>
                            <Input
                                className="h-12 text-base"
                                placeholder="https://youtube.com/watch?v=..."
                                value={formData.video_link}
                                onChange={e => setFormData(fd => ({ ...fd, video_link: e.target.value }))}
                                disabled={isLocked}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 5 && !submissionId && (
                <Alert>
                    <AlertDescription>Please save your progress on earlier steps before uploading files.</AlertDescription>
                </Alert>
            )}

            {/* STEP 6: Review & Submit */}
            {step === 6 && (
                <div className="space-y-4">
                    <Card className="border-[#1a5c38]/30">
                        <CardHeader className="bg-[#e8f5e9] rounded-t-xl">
                            <CardTitle className="text-base text-[#1a5c38]">Review Your Submission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {[
                                ['Project Title', formData.title || '—'],
                                ['Category', formData.category || '—'],
                                ['Custom Category', formData.category === 'Other' ? formData.custom_category || '—' : null],
                                ['Video Link', formData.video_link || 'Not provided'],
                            ].filter(([, v]) => v !== null).map(([label, value]) => (
                                <div key={label as string} className="grid grid-cols-[120px_1fr] gap-2 text-sm border-b border-gray-100 pb-3 last:border-0">
                                    <span className="text-gray-500 font-medium">{label}</span>
                                    <span className="text-[#1a1a1a]">{value}</span>
                                </div>
                            ))}

                            {/* Text fields preview */}
                            {[
                                { label: 'Problem Statement', value: formData.problem_statement, limit: WORD_LIMITS.problem_statement },
                                { label: 'Proposed Solution', value: formData.proposed_solution, limit: WORD_LIMITS.proposed_solution },
                                { label: 'Innovation Approach', value: formData.innovation_approach, limit: WORD_LIMITS.innovation_approach },
                                { label: 'Expected Impact', value: formData.expected_impact, limit: WORD_LIMITS.expected_impact },
                            ].map(({ label, value, limit }) => {
                                const wc = value.trim().split(/\s+/).filter(Boolean).length
                                return (
                                    <div key={label} className="border-b border-gray-100 pb-3 last:border-0 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-500">{label}</span>
                                            <span className={`text-xs ${wc > limit ? 'text-red-500' : 'text-gray-400'}`}>
                                                {wc} / {limit} words
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1a1a1a] line-clamp-3">{value || '—'}</p>
                                    </div>
                                )
                            })}

                            <div className="text-sm">
                                <span className="text-gray-500 font-medium">Files uploaded:</span>{' '}
                                <span className="text-[#1a1a1a]">{uploadedFiles.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {!isLocked && (
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="text-amber-500" size={16} />
                            <AlertDescription className="text-amber-700 text-sm ml-2">
                                Once submitted, your submission will be locked and cannot be edited. Make sure everything is correct.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLocked && (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full h-14 text-base font-bold bg-[#1a5c38] hover:bg-[#154d30] text-white"
                        >
                            {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting…</> : '🚀 Submit My Entry'}
                        </Button>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pb-4">
                {step > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex-1 h-12 border-[#1a5c38] text-[#1a5c38]">
                        <ChevronLeft size={18} className="mr-1" /> Back
                    </Button>
                )}
                {step < TOTAL_STEPS && (
                    <Button
                        onClick={handleNext}
                        disabled={saving}
                        className="flex-1 h-12 bg-[#1a5c38] hover:bg-[#154d30] text-white font-semibold"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <>Next <ChevronRight size={18} className="ml-1" /></>}
                    </Button>
                )}
            </div>
        </div>
    )
}
