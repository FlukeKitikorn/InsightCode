import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminUserItem, type AdminAiFeedbackItem, type AdminStats } from '../../services/adminApi'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import toast from 'react-hot-toast'

const PAGE_SIZE = 6
const FEEDBACK_PAGE_SIZE = 4

function getInitials(fullName: string | null, email: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(' ')
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (a + b).toUpperCase() || email[0].toUpperCase()
  }
  return email[0].toUpperCase()
}

/** แปลงบรรทัด log เป็นข้อความแสดงผล (เวลาอ่านง่าย + user + method path status) */
function formatLogLine(line: string): string {
  const parts = line.split('\t')
  if (parts.length >= 5) {
    const [iso, user, method, url, status] = parts
    let timeStr = iso
    try {
      const d = new Date(iso)
      if (!Number.isNaN(d.getTime())) {
        timeStr = d.toLocaleString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      }
    } catch {
      // keep iso
    }
    return `${timeStr}  |  ${user}  |  ${method} ${url} ${status}`
  }
  // รูปแบบเก่า: ขึ้นต้นด้วย ISO แล้วตามด้วย space
  const isoMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+(.*)$/)
  if (isoMatch) {
    const [, iso, rest] = isoMatch
    try {
      const d = new Date(iso)
      if (!Number.isNaN(d.getTime())) {
        const timeStr = d.toLocaleString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        return `${timeStr}  |  ${rest}`
      }
    } catch {
      // keep as is
    }
  }
  return line
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [feedback, setFeedback] = useState<AdminAiFeedbackItem[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingFeedback, setLoadingFeedback] = useState(true)
  const [search, setSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [showAnnounceModal, setShowAnnounceModal] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [announceType, setAnnounceType] = useState('info')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  // System resource: random values that change periodically
  const [cpu, setCpu] = useState(42)
  const [memory, setMemory] = useState(78)
  const [storage, setStorage] = useState(12)
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.min(95, Math.max(10, c + (Math.random() - 0.5) * 20)))
      setMemory((m) => Math.min(95, Math.max(15, m + (Math.random() - 0.5) * 15)))
      setStorage((s) => Math.min(90, Math.max(5, s + (Math.random() - 0.5) * 5)))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoadingStats(true)
        const s = await adminApi.getStats(accessToken)
        setStats(s)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'โหลดสถิติไม่สำเร็จ')
      } finally {
        setLoadingStats(false)
      }
    }
    void load()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoadingUsers(true)
        const { users: u } = await adminApi.listUsers(accessToken)
        setUsers(u)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ')
      } finally {
        setLoadingUsers(false)
      }
    }
    void load()
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoadingFeedback(true)
        const { feedback: f } = await adminApi.listAiFeedback(accessToken)
        setFeedback(f)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'โหลดข้อมูล AI insights ไม่สำเร็จ')
      } finally {
        setLoadingFeedback(false)
      }
    }
    void load()
  }, [accessToken])

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.fullName ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, userPage])

  const totalFeedbackPages = Math.max(1, Math.ceil(feedback.length / FEEDBACK_PAGE_SIZE))
  const pagedFeedback = useMemo(() => {
    const start = (feedbackPage - 1) * FEEDBACK_PAGE_SIZE
    return feedback.slice(start, start + FEEDBACK_PAGE_SIZE)
  }, [feedback, feedbackPage])

  const handleCreateAnnouncement = async () => {
    if (!accessToken || !announceTitle.trim() || !announceBody.trim()) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหา')
      return
    }
    try {
      setSendingAnnounce(true)
      await adminApi.createAnnouncement(accessToken, {
        title: announceTitle.trim(),
        body: announceBody.trim(),
        type: announceType,
      })
      toast.success('ประกาศข่าวสารแล้ว')
      setShowAnnounceModal(false)
      setAnnounceTitle('')
      setAnnounceBody('')
      setAnnounceType('info')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'สร้างประกาศไม่สำเร็จ')
    } finally {
      setSendingAnnounce(false)
    }
  }

  // System logs: load on mount and poll (terminal style, no button)
  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoadingLogs(true)
        const { logs: lines } = await adminApi.getLogs(accessToken)
        setLogs(lines)
      } catch {
        setLogs([])
      } finally {
        setLoadingLogs(false)
      }
    }
    void load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [accessToken])

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Stat Cards — real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Users"
          value={loadingStats ? '—' : String(stats?.usersCount ?? 0)}
          icon="groups"
          iconBg="bg-blue-50"
          iconColor="text-[#5586e7]"
        />
        <StatCard
          label="Problems"
          value={loadingStats ? '—' : String(stats?.problemsCount ?? 0)}
          icon="code"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="AI Feedback Count"
          value={loadingStats ? '—' : String(stats?.aiFeedbackCount ?? 0)}
          icon="psychology"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          label="Submissions"
          value={loadingStats ? '—' : String(stats?.submissionsCount ?? 0)}
          icon="bolt"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Announcement button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAnnounceModal(true)}
          className="btn btn-primary gap-2"
        >
          <span className="material-symbols-outlined">campaign</span>
          ประกาศข่าวสาร
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users — real data, table template like ProblemList, pagination, no Action, click to view */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Users</h2>
          <div className="relative max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setUserPage(1) }}
              placeholder="Search users..."
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/30"
            />
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {loadingUsers ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      {['User', 'Role', 'Submissions', 'Created'].map((h) => (
                        <th key={h} className="px-4 md:px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {pagedUsers.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
                      >
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#5586e7]/10 flex items-center justify-center font-bold text-[#5586e7] text-xs shrink-0">
                              {getInitials(user.fullName, user.email)}
                            </div>
                            <div className="text-sm">
                              <p className="font-bold text-slate-900 dark:text-white">{user.fullName || user.email}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.role}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.submissionsCount}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {pagedUsers.length === 0 && !loadingUsers && (
                      <tr>
                        <td colSpan={4} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">No users</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {!loadingUsers && totalUserPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <p className="text-xs text-slate-500">หน้า {userPage} / {totalUserPages}</p>
                <div className="flex gap-1">
                  <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)} className="p-1 rounded disabled:opacity-50">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button type="button" disabled={userPage >= totalUserPages} onClick={() => setUserPage((p) => p + 1)} className="p-1 rounded disabled:opacity-50">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side: AI Insights (real) + System Resource (random) */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent AI Insights</h2>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 space-y-4">
                {loadingFeedback ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
                  </div>
                ) : feedback.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มี AI feedback</p>
                ) : (
                  pagedFeedback.map((item) => (
                    <div key={item.id} className="pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shrink-0">
                          <span className="material-symbols-outlined text-[#5586e7] text-sm">auto_awesome</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.problemTitle ?? 'Submission'}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.qualityScore != null ? `Score ${item.qualityScore}/100` : ''} · {item.status}
                          </p>
                          {item.analysisText && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{item.analysisText}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {!loadingFeedback && totalFeedbackPages > 1 && (
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <p className="text-xs text-slate-500">หน้า {feedbackPage} / {totalFeedbackPages}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={feedbackPage <= 1}
                      onClick={() => setFeedbackPage((p) => p - 1)}
                      className="p-1 rounded disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      disabled={feedbackPage >= totalFeedbackPages}
                      onClick={() => setFeedbackPage((p) => p + 1)}
                      className="p-1 rounded disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Resource</h2>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
              {[
                { label: 'CPU USAGE', percent: Math.round(cpu), color: 'bg-[#5586e7]' },
                { label: 'MEMORY', percent: Math.round(memory), color: 'bg-orange-500' },
                { label: 'STORAGE', percent: Math.round(storage), color: 'bg-green-500' },
              ].map((res) => (
                <div key={res.label}>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                    <span>{res.label}</span>
                    <span>{res.percent}%</span>
                  </div>
                  <ProgressBar value={res.percent} color={res.color} trackColor="bg-slate-100 dark:bg-slate-700" height="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Logs — terminal style, auto-load + refresh */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-900">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs font-medium text-slate-400 ml-2">System Logs</span>
          {loadingLogs && <span className="ml-auto text-[10px] text-slate-500">กำลังโหลด...</span>}
        </div>
        <div className="min-h-[200px] max-h-[320px] overflow-auto p-4 font-mono text-xs text-slate-300">
          {logs.length === 0 && !loadingLogs ? (
            <p className="text-slate-500">ยังไม่มี log</p>
          ) : (
            logs.slice().reverse().map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all border-b border-slate-800/50 py-0.5 last:border-0">
                {formatLogLine(line)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">User</h3>
              <button type="button" onClick={() => setSelectedUser(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Email:</span> {selectedUser.email}</p>
              <p><span className="text-slate-500">Name:</span> {selectedUser.fullName ?? '—'}</p>
              <p><span className="text-slate-500">Role:</span> {selectedUser.role}</p>
              <p><span className="text-slate-500">Submissions:</span> {selectedUser.submissionsCount}</p>
              <p><span className="text-slate-500">Created:</span> {new Date(selectedUser.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Announcement modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ประกาศข่าวสาร</h3>
            <input
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
              placeholder="หัวข้อประกาศ"
              className="input input-bordered w-full mb-3"
            />
            <textarea
              value={announceBody}
              onChange={(e) => setAnnounceBody(e.target.value)}
              placeholder="เนื้อหา (จะเด้งเข้า Notification ของ User ทุกคน)"
              className="textarea textarea-bordered w-full h-32 mb-3"
            />
            <select
              value={announceType}
              onChange={(e) => setAnnounceType(e.target.value)}
              className="select select-bordered w-full mb-4"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAnnounceModal(false)} className="btn btn-ghost">ยกเลิก</button>
              <button type="button" onClick={handleCreateAnnouncement} disabled={sendingAnnounce} className="btn btn-primary">
                {sendingAnnounce ? <span className="loading loading-spinner loading-sm" /> : 'ประกาศ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
