import { useState } from 'react'
import type { Page } from '../types'
import PageLayout from '../components/layout/PageLayout'
import Sidebar from '../components/layout/Sidebar'
import StatCard from '../components/ui/StatCard'

const FUNCTION_TIMES = [
    { name: 'Auth.login', minutes: 24, pct: 85, bg: 'bg-blue-100', fill: 'bg-[#5586e7]/40' },
    { name: 'Data.parse', minutes: 12, pct: 45, bg: 'bg-green-100', fill: 'bg-green-600/20' },
    { name: 'UI.render', minutes: 8, pct: 30, bg: 'bg-orange-100', fill: 'bg-orange-500/20' },
    { name: 'API.fetch', minutes: 18, pct: 65, bg: 'bg-purple-100', fill: 'bg-purple-400/30' },
]

const CHART_BARS = [
    { pct: 40, color: 'bg-blue-200' }, { pct: 60, color: 'bg-blue-200' },
    { pct: 85, color: 'bg-blue-200' }, { pct: 50, color: 'bg-orange-200' },
    { pct: 30, color: 'bg-orange-200' }, { pct: 70, color: 'bg-blue-200' },
    { pct: 95, color: 'bg-blue-200' }, { pct: 40, color: 'bg-purple-200' },
    { pct: 65, color: 'bg-blue-200' }, { pct: 80, color: 'bg-blue-200' },
]

const ACTIVITY_ITEMS = [
    { icon: 'code', iconBg: 'bg-blue-100', iconColor: 'text-[#5586e7]', title: 'Large Refactor Session', description: 'Analyzed 1,200 lines across 12 files', state: 'High Focus', time: '2 hours ago' },
    { icon: 'bug_report', iconBg: 'bg-orange-100', iconColor: 'text-orange-500', title: 'Debugging Sprint', description: 'Rapid trial-and-error pattern detected', state: 'Stressed State', time: '5 hours ago' },
    { icon: 'model_training', iconBg: 'bg-purple-100', iconColor: 'text-purple-500', title: 'Documentation & Setup', description: 'Consistent typing speed • Low cognitive load', state: 'Relaxed', time: 'Yesterday' },
]

interface AiAnalyticsPageProps {
    onNavigate: (page: Page) => void
}

export default function AiAnalyticsPage({ onNavigate }: AiAnalyticsPageProps) {
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

    return (
        <PageLayout currentPage="analytics" onNavigate={onNavigate} fullScreen>
            {/* ── Sidebar + Content (fills remaining height) ────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <Sidebar
                    currentPage="analytics"
                    onNavigate={onNavigate}
                    title="CodeMind AI"
                    subtitle="Behavioral Analysis"
                    logoIcon="psychology"
                />

                {/* Scrollable Main Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* Page Header */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#191e24] border-b border-[#e8ebf3] dark:border-[#2a303c] px-6 md:px-8 py-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold tracking-tight dark:text-white">Behavioral Dashboard</h2>
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest">
                                Live Analysis
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative hidden sm:block">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#506795] text-lg">search</span>
                                <input
                                    className="w-56 pl-10 pr-4 py-2 bg-[#f6f6f8] dark:bg-gray-800 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5586e7]/50 dark:text-white"
                                    placeholder="Search insights..."
                                />
                            </div>
                            <button className="bg-[#5586e7] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#4474d6] transition-colors">
                                <span className="material-symbols-outlined text-sm">sync</span>
                                Sync Active
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1200px] mx-auto w-full">

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Focus Score" value="88/100" icon="bolt" trend="+5% from yesterday" trendUp={true} iconBg="bg-blue-50" iconColor="text-[#5586e7]" />
                            <StatCard label="Lines/Session" value="422" icon="code" trend="+12% vs avg" trendUp={true} iconBg="bg-green-50" iconColor="text-green-600" />
                            <StatCard label="Mental State" value="Flow" icon="psychology" trend="Stable for 45 mins" accentLeft={true} iconBg="bg-blue-50" iconColor="text-[#5586e7]" />
                            <StatCard label="Logic Blocks" value="14" icon="analytics" trend="-2% complexity" trendUp={false} iconBg="bg-purple-50" iconColor="text-purple-600" />
                        </div>

                        {/* AI Recommendation Banner */}
                        <div className="bg-gradient-to-r from-[#5586e7] to-[#8fa7f2] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <h3 className="text-xl font-bold">AI Deep Work Suggestion</h3>
                                    </div>
                                    <p className="text-white/90 text-base leading-relaxed mb-6">
                                        "Your typing patterns suggest a slight increase in frustration while refactoring{' '}
                                        <code className="bg-white/20 px-1.5 py-0.5 rounded text-sm">AuthService.ts</code>.
                                        Consider a 5-minute break to maintain your current Flow state."
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button className="bg-white text-[#5586e7] font-bold px-6 py-2.5 rounded-lg shadow-md hover:bg-white/90 transition-all text-sm">
                                            Apply Logic Tips
                                        </button>
                                        <button className="bg-white/20 text-white font-medium px-6 py-2.5 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all text-sm">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                                <div className="hidden lg:flex w-36 h-36 bg-white/10 rounded-full items-center justify-center backdrop-blur-md shrink-0">
                                    <span className="material-symbols-outlined text-6xl opacity-50">bubble_chart</span>
                                </div>
                            </div>
                            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Time Per Function */}
                            <div className="bg-white dark:bg-[#191e24] p-6 rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h4 className="text-lg font-bold dark:text-white">Time Spent per Function</h4>
                                        <p className="text-[#506795] text-sm italic">Avg 12m/func • Past 7 Days</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 cursor-pointer">more_vert</span>
                                </div>
                                <div className="space-y-5">
                                    {FUNCTION_TIMES.map((fn) => (
                                        <div key={fn.name} className="grid grid-cols-[90px_1fr_36px] items-center gap-4">
                                            <span className="text-xs font-bold text-[#506795] truncate">{fn.name}</span>
                                            <div className={`h-6 ${fn.bg} rounded-full relative overflow-hidden`}>
                                                <div className={`absolute inset-y-0 left-0 ${fn.fill} rounded-full transition-all duration-700`} style={{ width: `${fn.pct}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-right dark:text-white">{fn.minutes}m</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Emotional State Chart */}
                            <div className="bg-white dark:bg-[#191e24] p-6 rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-bold dark:text-white">Coding Emotional State</h4>
                                    <div className="flex gap-3">
                                        {[{ label: 'Flow', color: 'bg-blue-200 border-[#5586e7]/30' }, { label: 'Anxious', color: 'bg-orange-200 border-orange-300' }].map((l) => (
                                            <div key={l.label} className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full border ${l.color}`} />
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative h-48 mt-4">
                                    <div className="absolute inset-0 flex items-end gap-1 px-2">
                                        {CHART_BARS.map((bar, i) => (
                                            <div key={i} className={`flex-1 ${bar.color} rounded-t transition-all duration-500 hover:opacity-80`} style={{ height: `${bar.pct}%` }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-2">
                                    {['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'].map((t) => (
                                        <span key={t}>{t}</span>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                                    <span className="material-symbols-outlined text-[#5586e7]">analytics</span>
                                    <p className="text-xs leading-relaxed text-[#506795]">
                                        Your <strong>typing cadence</strong> peaked at 11:45 AM — high mental engagement during architectural decisions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Activity Detail */}
                        <div>
                            <div className="flex items-center justify-between border-b border-[#e8ebf3] dark:border-[#2a303c] pb-4 mb-6">
                                <h3 className="text-xl font-bold dark:text-white">Activity Detail</h3>
                                <div className="flex gap-2">
                                    {(['day', 'week', 'month'] as const).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setTimeRange(r)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${timeRange === r ? 'bg-[#5586e7] text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {ACTIVITY_ITEMS.map((item) => (
                                    <div
                                        key={item.title}
                                        className="flex items-center gap-4 md:gap-6 p-4 md:p-5 bg-white dark:bg-[#191e24] rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] hover:border-[#5586e7]/50 transition-all cursor-pointer"
                                    >
                                        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full ${item.iconBg} flex items-center justify-center ${item.iconColor} shrink-0`}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-sm dark:text-white">{item.title}</h5>
                                            <p className="text-xs text-[#506795] truncate">{item.description}</p>
                                        </div>
                                        <div className="text-right shrink-0 hidden sm:block">
                                            <p className="text-sm font-bold dark:text-white">{item.state}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{item.time}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 hidden md:block">chevron_right</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inline Footer */}
                        <footer className="mt-4 pt-8 border-t border-[#e8ebf3] dark:border-[#2a303c] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#506795]">
                            <p>© 2026 InsightCode AI Behavioral Analytics. All rights reserved.</p>
                            <div className="flex gap-4">
                                {['Privacy Policy', 'Data Anonymization', 'Documentation'].map((link) => (
                                    <a key={link} href="#" className="hover:text-[#5586e7] transition-colors">{link}</a>
                                ))}
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
