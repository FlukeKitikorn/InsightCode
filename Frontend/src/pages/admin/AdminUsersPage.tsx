import { useEffect, useState } from 'react'
import type { UserRole, UserStatus } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminUserItem } from '../../services/adminApi'
import toast from 'react-hot-toast'

const ROLES: UserRole[] = ['Developer', 'Admin', 'Lead Dev']
const STATUSES: UserStatus[] = ['Active', 'Suspended']

type AdminUserWithUi = AdminUserItem & {
  name: string
  status: UserStatus
  lastActive: string
  initials: string
}

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore()
  const [users, setUsers] = useState<AdminUserWithUi[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')

  useEffect(() => {
    if (!accessToken) return
    const load = async () => {
      try {
        setLoading(true)
        const { users: apiUsers } = await adminApi.listUsers(accessToken)
        setUsers(
          apiUsers.map((u) => {
            const name = u.fullName ?? u.email
            const initials = name
              .split(' ')
              .filter(Boolean)
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || u.email.charAt(0).toUpperCase()

            return {
              ...u,
              name,
              status: 'Active' as UserStatus,
              lastActive: new Date(u.createdAt).toLocaleString(),
              initials,
            }
          }),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load users'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [accessToken])

  const filtered = users.filter((u) => {
    const query = search.toLowerCase()
    const matchSearch =
      !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users</h1>
          <p className="text-sm text-slate-400">
            Manage all users in the system, including roles and account status.
          </p>
        </div>
        <button className="btn btn-primary btn-sm md:btn-md gap-2">
          <span className="material-symbols-outlined text-base">person_add</span>
          New user
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="select select-sm bg-slate-950 border-slate-700 text-xs"
          >
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
            className="select select-sm bg-slate-950 border-slate-700 text-xs"
          >
            <option value="all">All status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  {['User', 'Role', 'Status', 'Last Active', 'Action'].map((h) => (
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
                {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-800/70 transition-colors"
                >
                  <td className="px-4 md:px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5586e7]/10 flex items-center justify-center font-bold text-[#5586e7] text-xs shrink-0">
                        {user.initials}
                      </div>
                      <div className="text-xs md:text-sm">
                        <p className="font-bold text-slate-100">{user.name}</p>
                        <p className="text-[11px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs md:text-sm text-slate-300">
                    {user.role}
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-400 hidden md:table-cell">
                    {user.lastActive}
                  </td>
                  <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                    <div className="dropdown dropdown-left">
                      <button
                        tabIndex={0}
                        className="btn btn-xs btn-ghost text-slate-300"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu menu-sm bg-base-200 rounded-box shadow-lg mt-1 w-40"
                      >
                        <li>
                          <button type="button">View profile</button>
                        </li>
                        <li>
                          <button type="button">
                            {user.role === 'Admin' ? 'Demote to user' : 'Promote to admin'}
                          </button>
                        </li>
                        <li>
                          <button type="button">
                            {user.status === 'Active' ? 'Suspend user' : 'Restore user'}
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 md:px-6 py-6 text-center text-sm text-slate-500"
                  >
                    No users match the current filters.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-slate-900 px-4 md:px-6 py-3 border-t border-slate-800 flex justify-between items-center">
          <p className="text-[11px] text-slate-400">
            Showing {filtered.length} of {users.length} users
          </p>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-xs text-slate-400" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="btn btn-ghost btn-xs text-slate-400">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

