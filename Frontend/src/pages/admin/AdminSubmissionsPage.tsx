import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminSubmissionItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

const PAGE_SIZE = 15

export default function AdminSubmissionsPage() {
  const { accessToken } = useAuthStore()
  const [submissions, setSubmissions] = useState<AdminSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userSearch, setUserSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoading(true)
        const { submissions: apiSubs } = await adminApi.listSubmissions(accessToken, 500)
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

  const statuses = useMemo(() => {
    const set = new Set(submissions.map((s) => s.status))
    return Array.from(set).sort()
  }, [submissions])

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      const q = userSearch.toLowerCase().trim()
      const matchUser = !q || (s.userEmail ?? '').toLowerCase().includes(q)
      return matchStatus && matchUser
    })
  }, [submissions, statusFilter, userSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const acceptedCount = useMemo(() => submissions.filter((s) => s.status === 'accepted').length, [submissions])
  const avgExec = useMemo(() => {
    const withTime = submissions.filter((s) => s.executionTime != null) as { executionTime: number }[]
    if (!withTime.length) return 0
    return Math.round(withTime.reduce((a, s) => a + s.executionTime, 0) / withTime.length)
  }, [submissions])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">Submissions</h1>
        <p className="text-sm text-slate-400">
          ข้อมูลจริงจากระบบ กรองตามสถานะและดูรายบุคคล (ใครส่งอะไรมา)
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Total</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">{submissions.length}</div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Accepted</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">{acceptedCount}</div>
          <div className="stat-desc text-[11px] text-slate-400">
            {submissions.length ? `${Math.round((acceptedCount / submissions.length) * 100)}%` : '—'}
          </div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Avg exec time</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">{avgExec}ms</div>
        </div>
        <div className="stat bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2">
          <div className="stat-title text-[11px] text-slate-400">Statuses</div>
          <div className="stat-value text-lg md:text-2xl text-slate-50">{statuses.length}</div>
          <div className="stat-desc text-[11px] text-slate-400">{statuses.join(', ') || '—'}</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1) }}
            placeholder="Filter by user email..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="select select-sm bg-slate-950 border-slate-700 text-xs"
        >
          <option value="all">Status: All</option>
          {statuses.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
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
                {paged.map((s) => (
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
                {paged.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">
                      No submissions match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && totalPages > 1 && (
          <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex justify-between items-center">
            <p className="text-[11px] text-slate-400">หน้า {currentPage} / {totalPages} · รวม {filtered.length} รายการ</p>
            <div className="flex gap-1">
              <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="btn btn-ghost btn-xs">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="btn btn-ghost btn-xs">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

