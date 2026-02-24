import { useState } from 'react'
import type { Problem, ProblemStatus, Page } from '../types'
import PageLayout from '../components/layout/PageLayout'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

const PROBLEMS: Problem[] = [
    {
        id: 1, title: '1. Two Sum', difficulty: 'Easy', status: 'solved',
        tags: [{ label: 'Array' }, { label: 'Hash Table' }], acceptance: '49.2%',
        aiRecommend: 'Interview Hot', aiRecommendType: 'interview',
    },
    {
        id: 2, title: '206. Reverse Linked List', difficulty: 'Easy', status: 'unsolved',
        tags: [{ label: 'Linked List' }], acceptance: '72.4%',
        aiRecommend: 'Top Pick', aiRecommendType: 'top',
    },
    {
        id: 3, title: '102. Binary Tree Level Order Traversal', difficulty: 'Medium', status: 'attempted',
        tags: [{ label: 'Tree' }, { label: 'BFS' }], acceptance: '63.8%',
        aiRecommend: 'Weak Spot: Graphs', aiRecommendType: 'weak',
    },
    {
        id: 4, title: '42. Trapping Rain Water', difficulty: 'Hard', status: 'unsolved',
        tags: [{ label: 'Array' }, { label: 'Two Pointers' }], acceptance: '58.9%',
        aiRecommend: undefined, aiRecommendType: 'none',
    },
    {
        id: 5, title: '53. Maximum Subarray', difficulty: 'Medium', status: 'solved',
        tags: [{ label: 'Array' }, { label: 'DP' }], acceptance: '50.1%',
        aiRecommend: 'Top Pick', aiRecommendType: 'top',
    },
]

const STATUS_ICON: Record<ProblemStatus, { icon: string; color: string }> = {
    solved: { icon: 'check_circle', color: 'text-green-500' },
    attempted: { icon: 'hourglass_empty', color: 'text-orange-400' },
    unsolved: { icon: 'circle', color: 'text-slate-300' },
}

const AI_BADGE_STYLE: Record<string, string> = {
    interview: 'bg-purple-100 text-purple-600',
    top: 'bg-blue-100 text-[#5586e7]',
    weak: 'bg-amber-50 text-amber-700',
    none: 'bg-slate-100 text-slate-400',
}

interface ProblemExplorerPageProps {
    onNavigate: (page: Page) => void
}

export default function ProblemExplorerPage({ onNavigate }: ProblemExplorerPageProps) {
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const filtered = PROBLEMS.filter((p) => {
        const diffOk = difficultyFilter === 'all' || p.difficulty.toLowerCase() === difficultyFilter
        const statOk = statusFilter === 'all' || p.status === statusFilter
        return diffOk && statOk
    })

    return (
        <PageLayout currentPage="problems" onNavigate={onNavigate}>
            <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── Left: Problems ──────────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Daily Challenge Hero */}
                        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5586e7] to-[#7a9ef2] p-6 md:p-8 text-white shadow-xl shadow-[#5586e7]/20">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="max-w-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-yellow-300">workspace_premium</span>
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/80">Daily Challenge</span>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold mb-3">Longest Palindromic Substring</h1>
                                    <p className="text-white/80 mb-6 font-medium text-sm md:text-base">
                                        Master string manipulation and dynamic programming to earn +10 XP and maintain your 12-day streak.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => onNavigate('workspace')}
                                            className="bg-white text-[#5586e7] px-6 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-xl">play_arrow</span>
                                            Solve Now
                                        </button>
                                        <button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-6 py-2.5 rounded-lg font-bold hover:bg-white/30 transition-colors text-sm">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-center justify-center w-36 h-36 rounded-full border-8 border-white/20 bg-white/10 backdrop-blur-sm">
                                    <span className="text-3xl font-bold">75%</span>
                                    <span className="text-[10px] uppercase font-bold tracking-tighter text-white/80">Day Done</span>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute right-20 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        </section>

                        {/* Problem Table Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Filters */}
                            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                                <div className="flex flex-wrap gap-3">
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5586e7]/20 cursor-pointer"
                                    >
                                        <option value="all">Difficulty</option>
                                        {(['easy', 'medium', 'hard'] as string[]).map((d) => (
                                            <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5586e7]/20 cursor-pointer"
                                    >
                                        <option value="all">Status</option>
                                        <option value="solved">Solved</option>
                                        <option value="unsolved">Unsolved</option>
                                        <option value="attempted">Attempted</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => { setDifficultyFilter('all'); setStatusFilter('all') }}
                                    className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-[#5586e7] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">restart_alt</span>
                                    Reset
                                </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                                            <th className="text-left px-4 md:px-6 py-3">Status</th>
                                            <th className="text-left px-4 md:px-6 py-3">Title</th>
                                            <th className="text-left px-4 md:px-6 py-3 hidden sm:table-cell">AI Recommend</th>
                                            <th className="text-left px-4 md:px-6 py-3">Difficulty</th>
                                            <th className="text-left px-4 md:px-6 py-3 hidden md:table-cell">Acceptance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((problem) => {
                                            const { icon, color } = STATUS_ICON[problem.status]
                                            const aiStyle = AI_BADGE_STYLE[problem.aiRecommendType ?? 'none']
                                            return (
                                                <tr
                                                    key={problem.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 cursor-pointer"
                                                    onClick={() => onNavigate('workspace')}
                                                >
                                                    <td className="px-4 md:px-6 py-4">
                                                        <span className={`material-symbols-outlined ${color} text-xl`}>{icon}</span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{problem.title}</span>
                                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                                {problem.tags.map((t) => (
                                                                    <Badge key={t.label} variant="tag">{t.label}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${aiStyle}`}>
                                                            {problem.aiRecommend ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <Badge variant="difficulty" difficulty={problem.difficulty} />
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-slate-500 font-medium text-sm hidden md:table-cell">
                                                        {problem.acceptance}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex gap-1">
                                    {['«', '1', '2', '3', '»'].map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => typeof p === 'string' && !isNaN(Number(p)) && setCurrentPage(Number(p))}
                                            className={`w-9 h-9 text-sm rounded-lg border font-medium transition-colors ${p === String(currentPage)
                                                    ? 'bg-[#5586e7] border-[#5586e7] text-white'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#5586e7]'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Sidebar Stats ─────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Progress Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
                                <span className="material-symbols-outlined text-[#5586e7]">analytics</span>
                                Your Progress
                            </h3>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative w-24 h-24 shrink-0">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#5586e7" strokeWidth="10"
                                            strokeDasharray={`${(145 / 1200) * 264} 264`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold dark:text-white">145</span>
                                        <span className="text-[8px] uppercase font-bold text-slate-400">Solved</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    {[
                                        { label: 'Easy', color: 'bg-green-500', val: 80, max: 450 },
                                        { label: 'Medium', color: 'bg-amber-500', val: 50, max: 600 },
                                        { label: 'Hard', color: 'bg-red-500', val: 15, max: 150 },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={`font-bold ${item.label === 'Easy' ? 'text-green-600' : item.label === 'Medium' ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {item.label}
                                                </span>
                                                <span className="font-medium text-slate-500">{item.val}/{item.max}</span>
                                            </div>
                                            <ProgressBar value={item.val} max={item.max} color={item.color} height="h-1.5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-[#5586e7] uppercase mb-1">Streak</p>
                                    <p className="text-2xl font-bold text-slate-800">12 Days</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Rank</p>
                                    <p className="text-2xl font-bold text-slate-800">Top 5%</p>
                                </div>
                            </div>
                        </div>

                        {/* Mastery Map */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                                <span className="material-symbols-outlined text-[#5586e7]">radar</span>
                                Mastery Map
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Arrays', pct: 85 },
                                    { label: 'Strings', pct: 65 },
                                    { label: 'Graphs', pct: 30 },
                                    { label: 'DP', pct: 45 },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-16 text-xs font-bold text-slate-500">{item.label}</div>
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#5586e7] rounded-full transition-all duration-700"
                                                style={{ width: `${item.pct}%`, opacity: item.pct > 50 ? 1 : 0.5 }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 w-8 text-right">{item.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Contests */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-4 flex items-center justify-between dark:text-white">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#5586e7]">event</span>
                                    Contests
                                </span>
                                <a href="#" className="text-xs text-[#5586e7] font-bold hover:underline">View All</a>
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { month: 'MAR', day: 8, title: 'Biweekly Contest 118', time: '09:30 AM • 1h 30m', bg: 'bg-purple-50', textColor: 'text-purple-700' },
                                    { month: 'MAR', day: 10, title: 'Weekly Contest 368', time: '10:00 AM • 1h 30m', bg: 'bg-blue-50', textColor: 'text-[#5586e7]' },
                                ].map((contest) => (
                                    <div key={contest.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                        <div className={`w-12 h-12 rounded-lg ${contest.bg} flex flex-col items-center justify-center ${contest.textColor}`}>
                                            <span className="text-xs font-bold">{contest.month}</span>
                                            <span className="text-lg font-bold -mt-1">{contest.day}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{contest.title}</p>
                                            <p className="text-xs text-slate-400">{contest.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </PageLayout>
    )
}
