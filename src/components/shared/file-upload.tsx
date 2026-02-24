'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Loader2, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FILE_LIMITS } from '@/lib/constants'

interface UploadedFile {
    id: string
    name: string
    url: string
    size: number
    type: 'document' | 'image'
}

interface FileUploadProps {
    type: 'document' | 'image'
    submissionId: string
    userId: string
    existingFiles?: UploadedFile[]
    onFilesChange: (files: UploadedFile[]) => void
    disabled?: boolean
}

export function FileUpload({ type, submissionId, userId, existingFiles = [], onFilesChange, disabled }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const limits = FILE_LIMITS[type]
    const maxSizeBytes = limits.maxSizeMB * 1024 * 1024

    const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? [])
        if (!selected.length) return

        setError(null)

        // Validate
        const remaining = limits.max - files.length
        if (selected.length > remaining) {
            setError(`You can only upload ${limits.max} ${type}s total. You have ${remaining} slot(s) left.`)
            return
        }

        for (const f of selected) {
            if (f.size > maxSizeBytes) {
                setError(`${f.name} exceeds the ${limits.maxSizeMB}MB size limit.`)
                return
            }
            if (!(limits.types as readonly string[]).includes(f.type)) {
                setError(`${f.name} is not a supported file type.`)
                return
            }
        }

        setUploading(true)
        const supabase = createClient()
        const newFiles: UploadedFile[] = []

        for (let i = 0; i < selected.length; i++) {
            const f = selected[i]
            const path = `${userId}/${submissionId}/${Date.now()}_${f.name}`
            const { data, error: uploadError } = await supabase.storage
                .from('submission-files')
                .upload(path, f, { upsert: false })

            if (uploadError) {
                setError(`Upload failed: ${uploadError.message}`)
                break
            }

            const { data: { publicUrl } } = supabase.storage.from('submission-files').getPublicUrl(path)

            newFiles.push({
                id: data.path,
                name: f.name,
                url: publicUrl,
                size: f.size,
                type,
            })

            setUploadProgress(Math.round(((i + 1) / selected.length) * 100))
        }

        const updated = [...files, ...newFiles]
        setFiles(updated)
        onFilesChange(updated)
        setUploading(false)
        setUploadProgress(0)
        if (inputRef.current) inputRef.current.value = ''
    }, [files, limits, maxSizeBytes, submissionId, userId, type, onFilesChange])

    const handleRemove = useCallback(async (fileId: string) => {
        const supabase = createClient()
        await supabase.storage.from('submission-files').remove([fileId])
        const updated = files.filter(f => f.id !== fileId)
        setFiles(updated)
        onFilesChange(updated)
    }, [files, onFilesChange])

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const Icon = type === 'image' ? ImageIcon : FileText
    const atMax = files.length >= limits.max

    return (
        <div className="space-y-3">
            {/* Uploaded files list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                            <Icon size={18} className="text-[#1a5c38] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1a1a1a] truncate">{f.name}</p>
                                <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
                            </div>
                            {!disabled && (
                                <button
                                    onClick={() => handleRemove(f.id)}
                                    className="text-gray-400 hover:text-red-500 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            {!atMax && !disabled && (
                <>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className={cn(
                            'w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-colors',
                            'border-gray-200 hover:border-[#1a5c38] hover:bg-[#e8f5e9]/50',
                            uploading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="text-[#1a5c38] animate-spin" size={24} />
                        ) : (
                            <Upload className="text-gray-400" size={24} />
                        )}
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">
                                {type === 'image' ? 'Add photos (or use camera)' : 'Upload documents'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {limits.accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')} · Max {limits.maxSizeMB}MB each · {files.length}/{limits.max} uploaded
                            </p>
                        </div>
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={limits.accept}
                        multiple={limits.max > 1}
                        capture={type === 'image' ? 'environment' : undefined}
                        onChange={handleSelect}
                        className="hidden"
                    />
                </>
            )}

            {uploading && (
                <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-1.5 [&>div]:bg-[#1a5c38]" />
                    <p className="text-xs text-gray-400 text-center">Uploading… {uploadProgress}%</p>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}
        </div>
    )
}
