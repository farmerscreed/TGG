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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { UNIVERSITIES, UNIVERSITY_LABELS, GENDERS, YEARS_OF_STUDY } from '@/lib/constants'

const registerSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    gender: z.enum(['Male', 'Female', 'Prefer not to say']),
    university: z.enum(['UST', 'IAUE', 'UNIPORT']),
    department: z.string().min(2, 'Department is required'),
    year_of_study: z.enum(['100L', '200L', '300L', '400L', '500L', 'Postgraduate']),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const goToStep2 = async () => {
        const valid = await trigger(['first_name', 'last_name', 'email', 'phone'])
        if (valid) setCurrentStep(2)
    }

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // Create auth user — profile data is passed as metadata for the trigger to pick up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    university: data.university,
                }
            },
        })

        if (signUpError || !authData.user) {
            setError(signUpError?.message || 'Failed to create account')
            setLoading(false)
            return
        }

        // We no longer Need to manually insert into profiles/user_roles
        // because the handle_new_user() trigger handles it automatically
        // and bypasses RLS issues during initial signup.

        setSuccess(true)
        setLoading(false)
        // Redirect to login after 6 seconds so they can read the message
        setTimeout(() => router.push('/login'), 6000)
    }

    if (success) {
        return (
            <div className="w-full max-w-[440px] mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-[#1a5c38]" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1a1a1a]">Registration Successful!</h2>
                        <p className="text-gray-500 text-sm mt-1">Welcome to the Campus Eco-Challenge 2026.</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-left">
                        <p className="text-sm font-semibold text-amber-800 mb-1">📧 Check your email</p>
                        <p className="text-xs text-amber-700">
                            We&apos;ve sent a confirmation link to your email address.
                            Please click it to verify your account before logging in.
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">Redirecting you to the login page in a few seconds…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[440px] mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#1a5c38] px-6 py-6 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                            <Image src="/logo.png" alt="TGG Foundation" width={60} height={60} className="object-contain" />
                        </div>
                    </div>
                    <h1 className="text-white text-lg font-bold">Campus Eco-Challenge 2026</h1>
                    <p className="text-[#a7d9b3] text-xs mt-1">Tilda Goes Green Foundation</p>
                </div>

                {/* Step indicator */}
                <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#1a5c38]">Step {currentStep} of 2</span>
                        <span className="text-xs text-gray-400">{currentStep === 1 ? 'Personal Info' : 'Academic Info'}</span>
                    </div>
                    <Progress value={currentStep === 1 ? 50 : 100} className="h-1.5 [&>div]:bg-[#1a5c38]" />
                </div>

                {/* Form */}
                <div className="px-6 py-6">
                    <h2 className="text-[#1a1a1a] text-xl font-bold mb-1">
                        {currentStep === 1 ? 'Create your account' : 'Academic details'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-5">
                        {currentStep === 1 ? 'Enter your personal information' : 'Tell us about your studies'}
                    </p>

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {currentStep === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="first_name" className="text-sm font-medium">First Name</Label>
                                        <Input id="first_name" className="h-12 text-base" placeholder="Ada" {...register('first_name')} />
                                        {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="last_name" className="text-sm font-medium">Last Name</Label>
                                        <Input id="last_name" className="h-12 text-base" placeholder="Okonkwo" {...register('last_name')} />
                                        {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                    <Input id="email" type="email" className="h-12 text-base" placeholder="you@university.edu" {...register('email')} />
                                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                    <Input id="phone" type="tel" className="h-12 text-base" placeholder="08012345678" {...register('phone')} />
                                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Gender</Label>
                                    <Select onValueChange={(v) => setValue('gender', v as RegisterFormData['gender'])}>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="h-12 text-base pr-12"
                                            placeholder="Min. 8 characters"
                                            {...register('password')}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm_password" className="text-sm font-medium">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password"
                                            type={showConfirm ? 'text' : 'password'}
                                            className="h-12 text-base pr-12"
                                            placeholder="Repeat your password"
                                            {...register('confirm_password')}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center">
                                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && <p className="text-red-500 text-xs">{errors.confirm_password.message}</p>}
                                </div>

                                <Button type="button" onClick={goToStep2}
                                    className="w-full h-12 text-base font-semibold bg-[#1a5c38] hover:bg-[#154d30] text-white">
                                    Continue →
                                </Button>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">University</Label>
                                    <Select onValueChange={(v) => setValue('university', v as RegisterFormData['university'])}>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="Select your university" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UNIVERSITIES.map(u => (
                                                <SelectItem key={u} value={u}>{UNIVERSITY_LABELS[u]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.university && <p className="text-red-500 text-xs">{errors.university.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="department" className="text-sm font-medium">Department / Faculty</Label>
                                    <Input id="department" className="h-12 text-base" placeholder="e.g. Environmental Science" {...register('department')} />
                                    {errors.department && <p className="text-red-500 text-xs">{errors.department.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Year of Study</Label>
                                    <Select onValueChange={(v) => setValue('year_of_study', v as RegisterFormData['year_of_study'])}>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS_OF_STUDY.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.year_of_study && <p className="text-red-500 text-xs">{errors.year_of_study.message}</p>}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}
                                        className="flex-1 h-12 text-base border-[#1a5c38] text-[#1a5c38]">
                                        ← Back
                                    </Button>
                                    <Button type="submit" disabled={loading}
                                        className="flex-1 h-12 text-base font-semibold bg-[#1a5c38] hover:bg-[#154d30] text-white">
                                        {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating…</> : 'Create Account'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>

                    {currentStep === 1 && (
                        <div className="mt-5 text-center">
                            <p className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="text-[#1a5c38] font-semibold hover:underline">Sign in</Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-center text-white/60 text-xs mt-6">
                © 2026 Tilda Goes Green Foundation · All rights reserved
            </p>
        </div>
    )
}
