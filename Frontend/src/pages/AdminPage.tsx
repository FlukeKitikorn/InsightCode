import { useState } from 'react'
import type { AdminUser, AiInsight, Page } from '../types'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import { useAuthStore } from '../store/authStore'

const USERS: AdminUser[] = [
    { id: 'JD', initials: 'JS', name: 'Jordan Smith', email: 'jordan@dev.com', role: 'Developer', status: 'Active', lastActive: '2 mins ago' },
    { id: 'MC', initials: 'MC', name: 'Maria Chen', email: 'maria@admin.com', role: 'Admin', status: 'Active', lastActive: '1 hour ago' },
    { id: 'KB', initials: 'KB', name: 'Kenji Black', email: 'kenji@dev.com', role: 'Developer', status: 'Suspended', lastActive: '3 days ago' },
    { id: 'OL', initials: 'OL', name: 'Omi Lee', email: 'omi.lee@corp.com', role: 'Lead Dev', status: 'Active', lastActive: '10 mins ago' },
]

const AI_INSIGHTS: AiInsight[] = [
    { id: 1, icon: 'fact_check', bgColor: 'bg-blue-50', iconColor: 'text-[#5586e7]', title: 'Code Review #8421', description: 'Confidence: 98.4%', badge: 'Auto-approved', badgeColor: 'bg-[#5586e7]/10 text-[#5586e7]' },
    { id: 2, icon: 'bug_report', bgColor: 'bg-red-50', iconColor: 'text-red-600', title: 'Security Vulnerability Found', description: 'Auth module bypass risk', badge: 'Immediate Attention', badgeColor: 'bg-red-100 text-red-600' },
    { id: 3, icon: 'auto_awesome', bgColor: 'bg-green-50', iconColor: 'text-green-600', title: 'Optimization Suggestion', description: 'Redundant API calls in React hooks', badge: 'Pending Review', badgeColor: 'bg-green-100 text-green-700' },
]

const SYSTEM_RESOURCES = [
    { label: 'CPU USAGE', percent: 42, color: 'bg-[#5586e7]' },
    { label: 'MEMORY', percent: 78, color: 'bg-orange-500' },
    { label: 'STORAGE', percent: 12, color: 'bg-green-500' },
]

const SIDEBAR_NAV = [
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'User Management', icon: 'group' },
    { label: 'Challenges', icon: 'code_blocks' },
    { label: 'AI Reports', icon: 'analytics' },
    { label: 'Settings', icon: 'settings' },
]

interface AdminPageProps {
    onNavigate: (page: Page) => void
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
    const { user } = useAuthStore()
    const [activeNav, setActiveNav] = useState('Dashboard')
    const [search, setSearch] = useState('')

    const filteredUsers = USERS.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    )

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-[#020617] text-slate-50 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-4">
                    <span className="material-symbols-outlined text-5xl text-amber-500">lock</span>
                    <h2 className="text-2xl font-bold">Admin Access Only</h2>
                    <p className="text-sm text-slate-400">
                        You need an admin account to view this console. Please contact your administrator or use the admin login page.
                    </p>
                    <button
                        onClick={() => onNavigate('adminLogin')}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5586e7] text-white text-sm font-bold hover:bg-[#4474d6] transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                        Go to Admin Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
            {/* ── Sidebar + Content ─────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Admin Sidebar */}
                <aside className="w-64 bg-white dark:bg-[#111621] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                    {/* Heading */}
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#5586e7]">admin_panel_settings</span>
                            Admin Console
                        </h2>
                    </div>

                    <div className="px-4 pt-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                                search
                            </span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search users..."
                                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/30"
                            />
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {SIDEBAR_NAV.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => {
                                    setActiveNav(item.label)
                                    if (item.label === 'AI Reports') onNavigate('analytics')
                                    if (item.label === 'Challenges') onNavigate('problems')
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeNav === item.label
                                        ? 'bg-[#5586e7] text-white'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* System Status */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-[#5586e7]/10 p-4 rounded-xl">
                            <p className="text-xs font-bold text-[#5586e7] uppercase mb-2">System Status</p>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Models Online</span>
                            </div>
                            <ProgressBar value={94} color="bg-[#5586e7]" trackColor="bg-slate-200 dark:bg-slate-700" height="h-1.5" />
                            <p className="text-[10px] text-slate-500 mt-1">94.2% · API Latency: 12ms</p>
                        </div>
                    </div>
                </aside>

                {/* Scrollable Main */}
                <main className="flex-1 overflow-y-auto">                    

                    <div className="p-6 md:p-8 space-y-8">

                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Total Users" value="12,450" icon="groups" iconBg="bg-blue-50" iconColor="text-[#5586e7]" badge="+12%" badgeColor="bg-green-100 text-green-600" trend="+12% this month" trendUp={true} />
                            <StatCard label="Active Challenges" value="842" icon="code" iconBg="bg-green-50" iconColor="text-green-600" badge="+5%" badgeColor="bg-green-100 text-green-600" trend="+5% added" trendUp={true} />
                            <StatCard label="AI Analysis Volume" value="45.2k" icon="psychology" iconBg="bg-red-50" iconColor="text-red-600" badge="-2%" badgeColor="bg-red-100 text-red-600" trend="-2% from last week" trendUp={false} />
                            <StatCard label="System Uptime" value="99.9%" icon="bolt" iconBg="bg-orange-50" iconColor="text-orange-600" badge="Steady" badgeColor="text-slate-400 bg-slate-100" />
                        </div>

                        {/* Grid: Table + Side Widgets */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* User Table */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Users</h2>
                                    <button className="bg-[#5586e7] hover:bg-[#4474d6] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">person_add</span>
                                        <span className="hidden sm:inline">Add User</span>
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900">
                                                <tr>
                                                    {['User', 'Role', 'Status', 'Last Active', 'Action'].map((h) => (
                                                        <th key={h} className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-[#5586e7]/10 flex items-center justify-center font-bold text-[#5586e7] text-xs shrink-0">
                                                                    {user.initials}
                                                                </div>
                                                                <div className="text-sm">
                                                                    <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.role}</td>
                                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${user.status === 'Active'
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : 'bg-red-100 text-red-700 border-red-200'
                                                                }`}>
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500 italic hidden md:table-cell">{user.lastActive}</td>
                                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                            <button className="p-1 hover:text-[#5586e7] transition-all">
                                                                <span className="material-symbols-outlined text-xl">more_vert</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <p className="text-xs text-slate-500">Showing {filteredUsers.length} of 12,450 users</p>
                                        <div className="flex gap-1">
                                            <button className="p-1 text-slate-400 hover:text-[#5586e7] disabled:opacity-50 rounded transition-colors" disabled>
                                                <span className="material-symbols-outlined">chevron_left</span>
                                            </button>
                                            <button className="p-1 text-slate-400 hover:text-[#5586e7] rounded transition-colors">
                                                <span className="material-symbols-outlined">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Side Widgets */}
                            <div className="space-y-8">
                                {/* AI Insights */}
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent AI Insights</h2>
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4">
                                        {AI_INSIGHTS.map((insight, index) => (
                                            <div key={insight.id} className={`flex items-start gap-3 ${index < AI_INSIGHTS.length - 1 ? 'pb-4 border-b border-slate-100 dark:border-slate-700' : ''}`}>
                                                <div className={`p-2 ${insight.bgColor} rounded-lg shrink-0`}>
                                                    <span className={`material-symbols-outlined ${insight.iconColor} text-sm`}>{insight.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{insight.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
                                                    <span className={`text-[10px] ${insight.badgeColor} px-2 py-0.5 rounded-full inline-block mt-2 font-medium`}>
                                                        {insight.badge}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full text-center py-2 text-xs font-bold text-[#5586e7] hover:underline">View All Reports</button>
                                    </div>
                                </div>

                                {/* System Resources */}
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Resource</h2>
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
                                        {SYSTEM_RESOURCES.map((res) => (
                                            <div key={res.label}>
                                                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                                                    <span>{res.label}</span>
                                                    <span>{res.percent}%</span>
                                                </div>
                                                <ProgressBar
                                                    value={res.percent}
                                                    color={res.color}
                                                    trackColor="bg-slate-100 dark:bg-slate-700"
                                                    height="h-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Banner */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#5586e7]/10 text-[#5586e7] p-3 rounded-full shrink-0">
                                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Security Scan Complete</h4>
                                    <p className="text-sm text-slate-500">Last scanned today at 04:20 AM. All systems are compliant.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <button className="px-4 md:px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                                    Full Log
                                </button>
                                <button className="px-4 md:px-5 py-2.5 bg-[#5586e7] text-white rounded-lg text-sm font-bold hover:bg-[#4474d6] transition-all">
                                    Re-Scan Now
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
