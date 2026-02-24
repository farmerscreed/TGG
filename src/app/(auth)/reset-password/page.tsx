'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

const resetSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type ResetFormData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    })

    const onSubmit = async (data: ResetFormData) => {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
        })
        if (resetError) {
            setError('Something went wrong. Please try again.')
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    return (
        <div className="w-full max-w-[440px] mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-[#1a5c38] px-6 py-6 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                            <Image src="/logo.png" alt="TGG Foundation" width={60} height={60} className="object-contain" />
                        </div>
                    </div>
                    <h1 className="text-white text-lg font-bold">Campus Eco-Challenge 2026</h1>
                </div>

                <div className="px-6 py-8">
                    {!sent ? (
                        <>
                            <h2 className="text-[#1a1a1a] text-2xl font-bold mb-1">Reset Password</h2>
                            <p className="text-gray-500 text-sm mb-6">Enter your email and we will send you a reset link.</p>

                            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <Input id="email" type="email" className="h-12 text-base" placeholder="you@university.edu" {...register('email')} />
                                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                                </div>
                                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-[#1a5c38] hover:bg-[#154d30] text-white">
                                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending…</> : 'Send Reset Link'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-[#1a5c38]" />
                            </div>
                            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Check your inbox</h2>
                            <p className="text-gray-500 text-sm">We have sent a password reset link to your email address.</p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#1a5c38] font-medium hover:underline">
                            <ArrowLeft size={16} /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
