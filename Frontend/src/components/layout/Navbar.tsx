import type { Page } from '../../types'

interface NavbarProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

const NAV_ITEMS: { label: string; page: Page }[] = [
    { label: 'Problems', page: 'problems' },
    { label: 'Workspace', page: 'workspace' },
    { label: 'Analytics', page: 'analytics' },
    { label: 'Admin', page: 'admin' },
]

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:bg-[#111621]/80 dark:border-slate-800">
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => onNavigate('problems')}
                        className="flex items-center gap-2 text-[#5586e7] hover:opacity-80 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">terminal</span>
                        <h2 className="text-xl font-bold tracking-tight">InsightCode</h2>
                    </button>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`text-sm font-semibold transition-colors ${currentPage === item.page
                                        ? 'text-[#5586e7]'
                                        : 'text-slate-500 hover:text-[#5586e7]'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
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
                    <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>

                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-[#5586e7]/20 border-2 border-[#5586e7]/30 flex items-center justify-center font-bold text-[#5586e7] text-sm">
                        AR
                    </div>

                    {/* Auth button — show only on non-auth pages */}
                    {currentPage === 'auth' ? null : (
                        <button
                            onClick={() => onNavigate('auth')}
                            className="hidden md:flex items-center gap-1 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Sign Out
                        </button>
                    )}

                    {/* Mobile hamburger */}
                    <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
