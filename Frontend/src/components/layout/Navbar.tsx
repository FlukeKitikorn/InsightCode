import type { Page } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface NavbarProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

const NAV_ITEMS: { label: string; page: Page }[] = [
    { label: 'Problems', page: 'problems' },
    { label: 'Analytics', page: 'analytics' },
]

function getInitials(fullName: string | null, email: string | undefined): string {
    if (fullName && fullName.trim().length > 0) {
        const parts = fullName.trim().split(' ')
        const first = parts[0]?.[0] ?? ''
        const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
        const initials = (first + last).toUpperCase()
        return initials || fullName[0]?.toUpperCase() || 'U'
    }
    if (email) {
        return email[0].toUpperCase()
    }
    return 'U'
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
    const { user, logout } = useAuth()
    const [isNotifOpen, setIsNotifOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        toast.success('Signed out successfully')
        onNavigate('auth')
    }

    const showNav = currentPage !== 'auth'

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:bg-[#111621]/80 dark:border-slate-800">
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between relative">
                {/* Logo */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => onNavigate('problems')}
                        className="flex items-center gap-2 text-[#5586e7] hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">terminal</span>
                        <h2 className="text-xl font-bold tracking-tight">InsightCode</h2>
                    </button>

                    {/* Desktop Nav */}
                    {showNav && (
                        <nav className="hidden md:flex items-center gap-8 cursor-pointer">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.page}
                                    onClick={() => onNavigate(item.page)}
                                    className={`cursor-pointer text-sm font-semibold transition-colors ${currentPage === item.page
                                            ? 'text-[#5586e7]'
                                            : 'text-slate-500 hover:text-[#5586e7]'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {showNav && (
                        <>
                            {/* Search */}
                            <div className="relative hidden sm:block">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                    search
                                </span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-56 focus:ring-2 focus:ring-[#5586e7]/50 outline-none transition-all"
                                    placeholder="Search problems..."
                                    type="text"
                                />
                            </div>

                            {/* Notification */}
                            <button
                                type="button"
                                onClick={() => setIsNotifOpen((v) => !v)}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer relative"
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            {isNotifOpen && (
                                <div className="absolute right-4 top-14 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 space-y-2 text-sm z-40">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Notifications
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsNotifOpen(false)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <span className="material-symbols-outlined text-[#5586e7] text-base mt-0.5">bolt</span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                New AI insights available
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Your latest coding session has been analyzed. View suggestions in Analytics.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">schedule</span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                Daily challenge reminder
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Don&apos;t forget to complete today&apos;s problem to keep your streak.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsNotifOpen(false)}
                                        className="w-full mt-1 text-[11px] font-bold text-[#5586e7] hover:underline text-center"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}

                            {/* Avatar */}
                            <button
                                type="button"
                                onClick={() => onNavigate('profile')}
                                className="h-9 w-9 rounded-full bg-[#5586e7]/20 border-2 border-[#5586e7]/30 flex items-center justify-center font-bold text-[#5586e7] text-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#5586e7]/60"
                            >
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.fullName ?? user.email}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{getInitials(user?.fullName ?? null, user?.email)}</span>
                                )}
                            </button>

                            {/* Auth button */}
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex items-center gap-1 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                Sign Out
                            </button>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    {showNav && (
                        <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
