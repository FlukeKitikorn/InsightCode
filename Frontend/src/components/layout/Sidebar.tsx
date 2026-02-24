import type { Page } from '../../types'

interface SidebarProps {
    currentPage: Page
    onNavigate: (page: Page) => void
    title?: string
    subtitle?: string
    logoIcon?: string
}

interface NavItem {
    label: string
    icon: string
    page: Page
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', icon: 'dashboard', page: 'analytics' },
    { label: 'Problems', icon: 'code_blocks', page: 'problems' },
    { label: 'Workspace', icon: 'terminal', page: 'workspace' },
    { label: 'Admin', icon: 'admin_panel_settings', page: 'admin' },
]

export default function Sidebar({
    currentPage,
    onNavigate,
    title = 'InsightCode',
    subtitle = 'AI Analysis',
    logoIcon = 'psychology',
}: SidebarProps) {
    return (
        <aside className="w-64 border-r border-[#e8ebf3] dark:border-[#2a303c] bg-white dark:bg-[#191e24] flex flex-col justify-between p-4 shrink-0">
            <div className="flex flex-col gap-8">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-[#5586e7] rounded-lg p-2 text-white">
                        <span className="material-symbols-outlined">{logoIcon}</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[#0e121b] dark:text-white text-base font-bold leading-tight">
                            {title}
                        </h1>
                        <p className="text-[#506795] dark:text-gray-400 text-xs font-normal">{subtitle}</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${currentPage === item.page
                                    ? 'bg-[#5586e7]/10 text-[#5586e7]'
                                    : 'text-[#506795] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    <div className="h-px bg-[#e8ebf3] dark:bg-[#2a303c] my-2" />

                    <button
                        onClick={() => onNavigate('auth')}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#506795] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                        Settings
                    </button>
                </nav>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#5586e7]/20 border-2 border-[#5586e7]/30 flex items-center justify-center font-bold text-[#5586e7] text-sm shrink-0">
                    AR
                </div>
                <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold dark:text-white truncate">Alex Rivera</p>
                    <p className="text-[10px] text-[#506795] uppercase tracking-wider">Senior Dev</p>
                </div>
            </div>
        </aside>
    )
}
