import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminProblemItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

export default function ProblemListPage() {
  const { accessToken } = useAuthStore()
  const [problems, setProblems] = useState<AdminProblemItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoading(true)
        const { problems: apiProblems } = await adminApi.listProblems(accessToken)
        setProblems(apiProblems)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load problems'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [accessToken])
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Problems</h1>
          <p className="text-sm text-slate-400">
            Manage all coding problems in the system, including difficulty, visibility and testcases.
          </p>
        </div>
        <button className="btn btn-primary btn-sm md:btn-md gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          New problem
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            placeholder="Search by title..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="select select-sm bg-slate-950 border-slate-700 text-xs">
            <option value="all">All difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select className="select select-sm bg-slate-950 border-slate-700 text-xs">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  {['Title', 'Difficulty', '#Testcases', 'Submissions', 'Created At', 'Action'].map((h) => (
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
                {problems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-slate-100">
                      {p.title}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          p.difficulty === 'EASY'
                            ? 'bg-green-100 text-green-700'
                            : p.difficulty === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-slate-300">
                      {p.testcasesCount}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-slate-300">
                      {p.submissionsCount}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-ghost text-xs text-slate-300">
                          Edit
                        </button>
                        <button className="btn btn-xs btn-outline border-slate-600 text-xs text-slate-200">
                          Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {problems.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 md:px-6 py-6 text-center text-sm text-slate-500"
                    >
                      No problems in the system yet.
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