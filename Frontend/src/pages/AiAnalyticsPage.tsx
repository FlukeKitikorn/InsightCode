import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import type { Page } from '../types'
import PageLayout from '../components/layout/PageLayout'
import StatCard from '../components/ui/StatCard'
import D3BarChart from '../components/ui/D3BarChart'
import { useAuthStore } from '../store/authStore'
import { authApi, type UserProgress, type InsightItem } from '../services/authApi'

interface AiAnalyticsPageProps {
    onNavigate: (page: Page) => void
}

function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
    return d.toLocaleDateString()
}

export default function AiAnalyticsPage({ onNavigate }: AiAnalyticsPageProps) {
    const { accessToken } = useAuthStore()
    const [progress, setProgress] = useState<UserProgress | null>(null)
    const [insights, setInsights] = useState<InsightItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [insightsPage, setInsightsPage] = useState(1)
    const [insightsTotalPages, setInsightsTotalPages] = useState(1)
    const [loadingInsights, setLoadingInsights] = useState(false)
    const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null)

    const PAGE_SIZE = 5

    useEffect(() => {
        if (!accessToken) {
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)
        Promise.all([
            authApi.getProgress(accessToken),
            authApi.getMyInsights(accessToken, 1, PAGE_SIZE),
        ])
            .then(([progressRes, insightsRes]) => {
                if (cancelled) return
                setProgress(progressRes.progress)
                setInsights(insightsRes.insights)
                setInsightsPage(insightsRes.page)
                setInsightsTotalPages(insightsRes.totalPages)
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [accessToken])

    const handleInsightsPageChange = (nextPage: number) => {
        if (!accessToken) return
        if (nextPage < 1 || nextPage > insightsTotalPages) return
        setLoadingInsights(true)
        authApi
            .getMyInsights(accessToken, nextPage, PAGE_SIZE)
            .then((res) => {
                setInsights(res.insights)
                setInsightsPage(res.page)
                setInsightsTotalPages(res.totalPages)
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to load insights')
            })
            .finally(() => setLoadingInsights(false))
    }

    const qualityScores = insights
        .filter((i) => i.qualityScore != null)
        .slice(0, 10)
        .reverse()
    const chartData = qualityScores.map((i, idx) => ({
        label: `#${idx + 1}`,
        value: i.qualityScore as number,
    }))
    const avgQuality =
        qualityScores.length > 0
            ? Math.round(
                  qualityScores.reduce((a, i) => a + (i.qualityScore ?? 0), 0) / qualityScores.length
              )
            : null

    return (
        <PageLayout currentPage="analytics" onNavigate={onNavigate}>
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1200px] mx-auto w-full">
                        {/* Header */}
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#5586e7]">analytics</span>
                                AI Code Analytics
                            </h1>
                            <p className="text-sm text-[#506795] dark:text-gray-400 mt-1">
                                ความคืบหน้าและผลวิเคราะห์จากโค้ดที่คุณส่ง (จากระบบ AI/rule-based)
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-red-700 dark:text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : progress && (
                            <>
                                {/* 1. Progress summary (real data, no LLM) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        {
                                            label: 'โจทย์ที่ทำได้',
                                            value: `${progress.solvedTotal} / ${progress.totalProblems}`,
                                            icon: 'check_circle',
                                            trend: `${progress.attemptedTotal} ข้อที่เคยลอง`,
                                            trendUp: true,
                                            iconBg: 'bg-green-50',
                                            iconColor: 'text-green-600',
                                        },
                                        {
                                            label: 'Mastery (Easy)',
                                            value: `${progress.masteryByDifficulty.EASY}%`,
                                            icon: 'signal_cellular_alt',
                                            trend: `${progress.solvedByDifficulty.EASY}/${progress.totalsByDifficulty.EASY} ข้อ`,
                                            trendUp: progress.masteryByDifficulty.EASY >= 50,
                                            iconBg: 'bg-blue-50',
                                            iconColor: 'text-[#5586e7]',
                                        },
                                        {
                                            label: 'Mastery (Medium)',
                                            value: `${progress.masteryByDifficulty.MEDIUM}%`,
                                            icon: 'signal_cellular_alt',
                                            trend: `${progress.solvedByDifficulty.MEDIUM}/${progress.totalsByDifficulty.MEDIUM} ข้อ`,
                                            trendUp: progress.masteryByDifficulty.MEDIUM >= 50,
                                            iconBg: 'bg-amber-50',
                                            iconColor: 'text-amber-600',
                                        },
                                        {
                                            label: 'Mastery (Hard)',
                                            value: `${progress.masteryByDifficulty.HARD}%`,
                                            icon: 'signal_cellular_alt',
                                            trend: `${progress.solvedByDifficulty.HARD}/${progress.totalsByDifficulty.HARD} ข้อ`,
                                            trendUp: progress.masteryByDifficulty.HARD >= 50,
                                            iconBg: 'bg-red-50',
                                            iconColor: 'text-red-600',
                                        },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.06, duration: 0.3 }}
                                            viewport={{ once: true, amount: 0.4 }}
                                        >
                                            <StatCard
                                                label={item.label}
                                                value={item.value}
                                                icon={item.icon}
                                                trend={item.trend}
                                                trendUp={item.trendUp}
                                                iconBg={item.iconBg}
                                                iconColor={item.iconColor}
                                            />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* 2. Quality score trend (from AI/rule-based feedback) */}
                                <div className="bg-white dark:bg-[#191e24] p-6 rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] shadow-sm">
                                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold dark:text-white">
                                                คะแนนคุณภาพโค้ด (จาก AI)
                                            </h4>
                                            <p className="text-[#506795] text-sm">
                                                {chartData.length
                                                    ? `Submission ล่าสุด ${chartData.length} ข้อ · เฉลี่ย ${avgQuality}/100`
                                                    : 'ส่งโค้ดแล้วจะเห็นคะแนนคุณภาพจากระบบวิเคราะห์'}
                                            </p>
                                        </div>
                                    </div>
                                    {chartData.length > 0 ? (
                                        <D3BarChart data={chartData} max={100} />
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-[#506795] text-sm rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            ยังไม่มีข้อมูลคะแนนคุณภาพ
                                        </div>
                                    )}
                                </div>

                                {/* 3. Recent AI insights */}
                                    <div>
                                    <div className="flex items-center justify-between border-b border-[#e8ebf3] dark:border-[#2a303c] pb-4 mb-4">
                                        <h3 className="text-xl font-bold dark:text-white">
                                            ผลวิเคราะห์ล่าสุด (จากโค้ดที่ส่ง)
                                        </h3>
                                    </div>
                                    {insights.length === 0 ? (
                                        <div className="p-8 text-center text-[#506795] dark:text-gray-400 rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] bg-gray-50/50 dark:bg-gray-800/30">
                                            ยังไม่มี submission ที่มีผลวิเคราะห์ · ไปที่โจทย์แล้วกด Submit เพื่อดู AI feedback
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {insights.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    onClick={() => setSelectedInsight(item)}
                                                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-[#191e24] rounded-xl border border-[#e8ebf3] dark:border-[#2a303c] hover:border-[#5586e7]/60 transition-all cursor-pointer"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <span className="font-bold text-sm dark:text-white truncate">
                                                                {item.problemTitle ?? 'Unknown'}
                                                            </span>
                                                            {item.difficulty && (
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                                        item.difficulty === 'EASY'
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                                            : item.difficulty === 'MEDIUM'
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                                    }`}
                                                                >
                                                                    {item.difficulty}
                                                                </span>
                                                            )}
                                                            <span
                                                                className={`text-xs font-medium ${
                                                                    item.status === 'accepted'
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }`}
                                                            >
                                                                {item.status}
                                                            </span>
                                                            {item.qualityScore != null && (
                                                                <span className="text-xs text-[#506795]">
                                                                    คะแนนคุณภาพ {item.qualityScore}/100
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.analysisText && (
                                                            <p className="text-xs text-[#506795] dark:text-gray-400 line-clamp-2 whitespace-pre-wrap">
                                                                {item.analysisText.trim().split('\n').slice(0, 2).join(' · ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 shrink-0">
                                                        {formatDate(item.createdAt)}
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <div className="flex items-center justify-between mt-2 text-[11px] text-[#506795] dark:text-gray-400">
                                                <span>
                                                    หน้า {insightsPage} / {insightsTotalPages}
                                                    {loadingInsights && ' · กำลังโหลด...'}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={insightsPage <= 1 || loadingInsights}
                                                        onClick={() => handleInsightsPageChange(insightsPage - 1)}
                                                        className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        ก่อนหน้า
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={insightsPage >= insightsTotalPages || loadingInsights}
                                                        onClick={() => handleInsightsPageChange(insightsPage + 1)}
                                                        className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        ถัดไป
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Ask AI (placeholder – LLM could answer from progress + feedback context) */}
                                <div className="bg-gradient-to-r from-[#5586e7] to-[#8fa7f2] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined">auto_awesome</span>
                                            <h3 className="text-xl font-bold">Ask AI (Coming soon)</h3>
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed">
                                            ในอนาคตคุณจะสามารถถามคำถามเช่น &quot;ควรฝึกโจทย์แบบไหนต่อ?&quot; หรือ
                                            &quot;จุดอ่อนของฉันคืออะไร?&quot; ระบบจะส่งสรุปความคืบหน้าและผลวิเคราะห์ล่าสุดให้
                                            LLM เพื่อตอบแบบส่วนตัว
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-white/80 text-xs">
                                            <span className="material-symbols-outlined text-base">info</span>
                                            การวิเคราะห์ปัจจุบันมาจากโค้ดที่คุณส่งในแต่ละข้อ (คุณภาพ โครงสร้าง
                                            คำแนะนำ) ไม่ใช้ข้อมูลการพิมพ์หรือสภาวะจิต
                                        </div>
                                    </div>
                                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {selectedInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white dark:bg-[#191e24] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8ebf3] dark:border-[#2a303c]">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#506795] dark:text-gray-400 uppercase tracking-wide mb-1">
                                    AI Feedback Detail
                                </p>
                                <h2 className="text-sm md:text-base font-bold dark:text-white truncate">
                                    {selectedInsight.problemTitle ?? 'Unknown problem'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedInsight(null)}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                        <div className="px-4 pt-3 pb-4 flex flex-col gap-3 overflow-y-auto text-xs md:text-sm">
                            <div className="flex flex-wrap gap-2 items-center">
                                {selectedInsight.difficulty && (
                                    <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                                            selectedInsight.difficulty === 'EASY'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                : selectedInsight.difficulty === 'MEDIUM'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                        }`}
                                    >
                                        {selectedInsight.difficulty}
                                    </span>
                                )}
                                <span
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        selectedInsight.status === 'accepted'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    }`}
                                >
                                    {selectedInsight.status}
                                </span>
                                {selectedInsight.language && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        {selectedInsight.language}
                                    </span>
                                )}
                                {selectedInsight.qualityScore != null && (
                                    <span className="text-[11px] text-[#506795] dark:text-gray-300 ml-auto">
                                        คะแนนคุณภาพ {selectedInsight.qualityScore}/100
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                                ส่งเมื่อ {new Date(selectedInsight.createdAt).toLocaleString()}
                            </div>
                            <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/40">
                                <p className="text-[11px] font-bold text-[#506795] dark:text-gray-300 mb-1">
                                    ข้อความจาก AI
                                </p>
                                <pre className="whitespace-pre-wrap text-xs md:text-sm text-[#506795] dark:text-gray-200">
                                    {selectedInsight.analysisText ?? 'ไม่มีข้อความวิเคราะห์จาก AI'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    )
}
