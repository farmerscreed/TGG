'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard, FileText, User, Bell, Users, Settings,
    BarChart2, Award, LogOut, ClipboardList, School, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Role = 'participant' | 'admin' | 'judge' | 'coordinator'

interface NavItem {
    href: string
    label: string
    icon: React.ReactNode
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
    participant: [
        { href: '/participant', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
        { href: '/participant/submission', label: 'Submission', icon: <FileText size={22} /> },
        { href: '/participant/team', label: 'Team', icon: <Users size={22} /> },
        { href: '/participant/profile', label: 'Profile', icon: <User size={22} /> },
    ],
    admin: [
        { href: '/admin', label: 'Overview', icon: <BarChart2 size={22} /> },
        { href: '/admin/participants', label: 'Participants', icon: <Users size={22} /> },
        { href: '/admin/submissions', label: 'Submissions', icon: <FileText size={22} /> },
        { href: '/admin/judges', label: 'Judges', icon: <Award size={22} /> },
        { href: '/admin/leaderboard', label: 'Leaderboard', icon: <ClipboardList size={22} /> },
        { href: '/admin/coordinators', label: 'Coordinators', icon: <School size={22} /> },
        { href: '/admin/settings', label: 'Settings', icon: <Settings size={22} /> },
        { href: '/admin/reports', label: 'Reports', icon: <BarChart2 size={22} /> },
    ],
    judge: [
        { href: '/judge', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
        { href: '/judge/profile', label: 'Profile', icon: <User size={22} /> },
    ],
    coordinator: [
        { href: '/coordinator', label: 'Overview', icon: <LayoutDashboard size={22} /> },
        { href: '/coordinator/participants', label: 'Participants', icon: <Users size={22} /> },
        { href: '/coordinator/submissions', label: 'Submissions', icon: <FileText size={22} /> },
    ],
}

// Only show first 4 items in bottom nav on mobile
const MOBILE_NAV_MAX = 4

interface SidebarProps {
    role: Role
    userName: string
    userInitials: string
}

export function Sidebar({ role, userName, userInitials }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const items = NAV_ITEMS[role] ?? []

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#1a5c38] text-white fixed left-0 top-0 bottom-0 z-30">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Image src="/logo.png" alt="TGG" width={36} height={36} className="object-contain" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">Eco-Challenge 2026</p>
                        <p className="text-white/60 text-xs">Tilda Goes Green</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-white text-[#1a5c38] shadow-sm'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* User + sign out */}
            <div className="px-3 py-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#e8f5e9] text-[#1a5c38] flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {userInitials}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-white/50 capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-white/70 hover:text-white hover:bg-white/10 text-sm transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}

export function MobileNav({ role }: { role: Role }) {
    const pathname = usePathname()
    const items = (NAV_ITEMS[role] ?? []).slice(0, MOBILE_NAV_MAX)

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-area-inset-bottom">
            <div className="flex items-center justify-around px-2 py-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] min-h-[56px] justify-center transition-colors',
                                isActive ? 'text-[#1a5c38]' : 'text-gray-400'
                            )}
                        >
                            <span className={cn(
                                'flex items-center justify-center w-6 h-6',
                                isActive ? 'scale-110' : ''
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
