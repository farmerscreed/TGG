'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (signInError) {
            setError('Invalid email or password. Please try again.')
            setLoading(false)
            return
        }

        // Get role and redirect
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('id', user.id)
                .single()

            const roleRedirects: Record<string, string> = {
                admin: '/admin',
                coordinator: '/coordinator',
                judge: '/judge',
                participant: '/participant',
            }
            router.push(roleRedirects[roleData?.role ?? 'participant'] ?? '/participant')
            router.refresh()
        }
    }

    return (
        <div className="w-full max-w-[440px] mx-auto">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#1a5c38] px-6 py-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                            <Image src="/logo.png" alt="TGG Foundation" width={72} height={72} className="object-contain" />
                        </div>
                    </div>
                    <h1 className="text-white text-xl font-bold leading-tight">Campus Eco-Challenge 2026</h1>
                    <p className="text-[#a7d9b3] text-sm mt-1">Tilda Goes Green Foundation</p>
                </div>

                {/* Form */}
                <div className="px-6 py-8">
                    <h2 className="text-[#1a1a1a] text-2xl font-bold mb-1">Welcome back</h2>
                    <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@university.edu"
                                className="h-12 text-base border-gray-300 focus:border-[#1a5c38] focus:ring-[#1a5c38]"
                                {...register('email')}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    className="h-12 text-base pr-12 border-gray-300 focus:border-[#1a5c38] focus:ring-[#1a5c38]"
                                    {...register('password')}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/reset-password"
                                className="text-sm text-[#1a5c38] hover:underline font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 text-base font-semibold bg-[#1a5c38] hover:bg-[#154d30] text-white transition-colors"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in…</>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            New participant?{' '}
                            <Link href="/register" className="text-[#1a5c38] font-semibold hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/60 text-xs mt-6">
                © 2026 Tilda Goes Green Foundation · All rights reserved
            </p>
        </div>
    )
}
