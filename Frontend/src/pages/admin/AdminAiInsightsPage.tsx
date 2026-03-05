import { useEffect, useMemo, useState } from 'react'
import D3BarChart from '../../components/ui/D3BarChart'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminAiFeedbackItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

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
        const message = error instanceof Error ? error.message : 'โหลดข้อมูล AI feedback ไม่สำเร็จ'
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
            <p className="text-[11px] text-slate-400">จากข้อมูลจริง</p>
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

      <p className="text-xs text-slate-400">
        วิเคราะห์จาก: ระบบ rule-based (เมื่อเปิดใช้ OpenRouter จะเรียก LLM และอาจแสดง model name)
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-slate-900/70 border border-slate-800">
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base text-slate-100">Quality score distribution</h2>
              <span className="badge badge-outline badge-sm text-slate-300">
                {loading ? 'Loading...' : 'ข้อมูลจริง'}
              </span>
            </div>
            <D3BarChart data={scoreBuckets} max={Math.max(5, ...scoreBuckets.map((b) => b.value))} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-100">Recent AI feedback</h2>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มี feedback</p>
            ) : (
              items.slice(0, 5).map((f) => (
                <div key={f.id} className="pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                  <p className="text-xs font-bold text-slate-100">{f.problemTitle ?? '—'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Score {f.qualityScore ?? '—'}/100 · {f.status} · {f.language ?? '—'}
                  </p>
                  {f.analysisText && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{f.analysisText}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

