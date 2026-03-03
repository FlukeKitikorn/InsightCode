import { useEffect, useMemo, useState } from 'react'
import type { AiInsight } from '../../types'
import D3BarChart from '../../components/ui/D3BarChart'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminAiFeedbackItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

const STATIC_INSIGHTS: AiInsight[] = [
  { id: 1, icon: 'priority_high', bgColor: 'bg-red-50', iconColor: 'text-red-600', title: 'Nested loops in large inputs', description: 'Detected potential O(N^2) patterns in multiple problems', badge: 'Performance risk', badgeColor: 'bg-red-100 text-red-700' },
  { id: 2, icon: 'lightbulb', bgColor: 'bg-blue-50', iconColor: 'text-[#5586e7]', title: 'Missing edge case checks', description: 'Null/empty inputs often not handled in beginner submissions', badge: 'Common pattern', badgeColor: 'bg-blue-100 text-blue-700' },
  { id: 3, icon: 'psychology', bgColor: 'bg-green-50', iconColor: 'text-green-600', title: 'Good use of Set/Map', description: 'High correlation between data-structure usage and better scores', badge: 'Positive signal', badgeColor: 'bg-green-100 text-green-700' },
]

export default function AdminAiInsightsPage() {
  const { accessToken } = useAuthStore()
  const [items, setItems] = useState<AdminAiFeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoading(true)
        const { feedback } = await adminApi.listAiFeedback(accessToken)
        setItems(feedback)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load AI feedback'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [accessToken])

  const scoreBuckets = useMemo(() => {
    const buckets = [
      { label: '0-20', value: 0 },
      { label: '20-40', value: 0 },
      { label: '40-60', value: 0 },
      { label: '60-80', value: 0 },
      { label: '80-100', value: 0 },
    ]
    items.forEach((f) => {
      if (f.qualityScore == null) return
      const q = f.qualityScore
      if (q < 20) buckets[0].value++
      else if (q < 40) buckets[1].value++
      else if (q < 60) buckets[2].value++
      else if (q < 80) buckets[3].value++
      else buckets[4].value++
    })
    return buckets
  }, [items])

  const avgScore = useMemo(() => {
    const scores = items.map((f) => f.qualityScore).filter((n): n is number => n != null)
    if (!scores.length) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }, [items])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">AI Insights</h1>
        <p className="text-sm text-slate-400">
          High-level view of how the AI feedback system is evaluating and guiding developers.
        </p>
      </header>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-slate-900/70 border border-slate-800">
          <div className="card-body py-3 px-4 space-y-1">
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              Average quality score
            </p>
            <p className="text-xl md:text-2xl font-bold text-slate-50">
              {avgScore.toFixed(1)}
            </p>
            <p className="text-[11px] text-emerald-400">mock trend</p>
          </div>
        </div>
        <div className="card bg-slate-900/70 border border-slate-800">
          <div className="card-body py-3 px-4 space-y-1">
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              Feedback generated (7 days)
            </p>
              <p className="text-xl md:text-2xl font-bold text-slate-50">
                {items.length}
              </p>
            <p className="text-[11px] text-slate-400">Across all languages</p>
          </div>
        </div>
        <div className="card bg-slate-900/70 border border-slate-800">
          <div className="card-body py-3 px-4 space-y-1">
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
              Low-score alerts
            </p>
              <p className="text-xl md:text-2xl font-bold text-red-400">
                {items.filter((f) => (f.qualityScore ?? 100) < 30).length}
              </p>
            <p className="text-[11px] text-slate-400">Score below 30</p>
          </div>
        </div>
      </div>

      {/* Chart + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-slate-900/70 border border-slate-800">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base text-slate-100">
                Quality score distribution
              </h2>
              <span className="badge badge-outline badge-sm text-slate-300">
                {loading ? 'Loading...' : 'Last 50 feedback'}
              </span>
            </div>
            <D3BarChart data={scoreBuckets} max={Math.max(5, Math.max(...scoreBuckets.map((b) => b.value)))} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Insight feed</h2>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            {(items.length ? STATIC_INSIGHTS : STATIC_INSIGHTS).map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0"
              >
                <div className={`p-2 ${insight.bgColor} rounded-lg shrink-0`}>
                  <span className={`material-symbols-outlined ${insight.iconColor} text-sm`}>
                    {insight.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{insight.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{insight.description}</p>
                  <span
                    className={`mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${insight.badgeColor}`}
                  >
                    {insight.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

