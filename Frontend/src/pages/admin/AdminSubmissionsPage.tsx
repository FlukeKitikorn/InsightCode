import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminSubmissionItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

export default function AdminSubmissionsPage() {
  const { accessToken } = useAuthStore()
  const [submissions, setSubmissions] = useState<AdminSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoading(true)
        const { submissions: apiSubs } = await adminApi.listSubmissions(accessToken, 200)
        setSubmissions(apiSubs)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load submissions'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [accessToken])
  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">Submissions</h1>
        <p className="text-sm text-slate-400">
          Monitor submission trends and review recent submissions across the platform.
        </p>
      </header>

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Today submissions</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">1,284</div>
          <div className="stat-desc text-[11px] text-emerald-400">+8% vs yesterday</div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Acceptance rate</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">42%</div>
          <div className="stat-desc text-[11px] text-slate-400">Last 7 days</div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Avg exec time</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">68ms</div>
          <div className="stat-desc text-[11px] text-slate-400">All languages</div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">AI analyzed</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">78%</div>
          <div className="stat-desc text-[11px] text-slate-400">with AiFeedback</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            placeholder="Search by user or problem..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="select select-sm bg-slate-950 border-slate-700 text-xs">
            <option>Status: All</option>
            <option>Accepted</option>
            <option>Wrong answer</option>
            <option>Pending</option>
          </select>
          <select className="select select-sm bg-slate-950 border-slate-700 text-xs">
            <option>Language: All</option>
            <option>TypeScript</option>
            <option>JavaScript</option>
            <option>Python</option>
          </select>
          <select className="select select-sm bg-slate-950 border-slate-700 text-xs">
            <option>Range: 24h</option>
            <option>7 days</option>
            <option>30 days</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-3 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  {['User', 'Problem', 'Language', 'Status', 'Exec Time', 'Created At'].map((h) => (
                    <th
                      key={h}
                      className="px-4 md:px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-slate-100">
                      {s.userEmail ?? '—'}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-slate-200">
                      {s.problemTitle ?? '—'}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      {s.language ?? '—'}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                          s.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : s.status === 'wrong_answer'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">
                      {s.executionTime != null ? `${s.executionTime} ms` : '—'}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 md:px-6 py-6 text-center text-sm text-slate-500"
                    >
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

