import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminUserItem } from '../../services/adminApi'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const ROLES = ['USER', 'ADMIN'] as const

function getInitials(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(' ')
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (a + b).toUpperCase() || email[0].toUpperCase()
  }
  return email[0].toUpperCase()
}

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore()
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<AdminUserItem | null>(null)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUserItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', fullName: '', role: 'USER' as string })
  const [editForm, setEditForm] = useState({ fullName: '', role: '' })

  const loadUsers = async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const { users: list } = await adminApi.listUsers(accessToken)
      setUsers(list)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [accessToken])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      const matchSearch =
        !q ||
        (u.fullName ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const handleCreate = async () => {
    if (!accessToken || !createForm.email.trim() || !createForm.password) {
      toast.error('กรุณากรอก email และ password')
      return
    }
    if (createForm.password.length < 8) {
      toast.error('Password ต้องอย่างน้อย 8 ตัวอักษร')
      return
    }
    try {
      setSaving(true)
      await adminApi.createUser(accessToken, {
        email: createForm.email.trim(),
        password: createForm.password,
        fullName: createForm.fullName.trim() || undefined,
        role: createForm.role,
      })
      toast.success('สร้าง user เรียบร้อย')
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', fullName: '', role: 'USER' })
      void loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'สร้าง user ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!accessToken || !showEditModal) return
    try {
      setSaving(true)
      await adminApi.updateUser(accessToken, showEditModal.id, {
        fullName: editForm.fullName.trim() || undefined,
        role: editForm.role === 'ADMIN' ? 'ADMIN' : 'USER',
      })
      toast.success('อัปเดต user เรียบร้อย')
      setShowEditModal(null)
      setShowEditConfirm(false)
      void loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'อัปเดตไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteConfirm) return
    try {
      setSaving(true)
      await adminApi.deleteUser(accessToken, deleteConfirm.id)
      toast.success('ลบ user เรียบร้อย')
      setDeleteConfirm(null)
      void loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (user: AdminUserItem) => {
    setShowEditModal(user)
    setEditForm({ fullName: user.fullName ?? '', role: user.role })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users</h1>
          <p className="text-sm text-slate-400">
            จัดการ user ในระบบ สร้าง/แก้ไข/ลบ
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-sm md:btn-md gap-2"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          New user
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1) }}
          className="select select-sm bg-slate-950 border-slate-700 text-xs"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900">
                <tr>
                  {['User', 'Role', '#Submissions', 'Created At', 'Action'].map((h) => (
                    <th key={h} className="px-4 md:px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paged.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 md:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5586e7]/10 flex items-center justify-center font-bold text-[#5586e7] text-xs shrink-0">
                          {getInitials(user.fullName, user.email)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{user.fullName || user.email}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">{user.role}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">{user.submissionsCount}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="btn btn-xs btn-ghost btn-circle text-slate-200 hover:text-white"
                          aria-label="Edit user"
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(user)}
                          className="btn btn-xs btn-ghost btn-circle text-red-400 hover:text-red-200"
                          aria-label="Delete user"
                          title="Delete user"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">No users</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && totalPages > 1 && (
          <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex justify-between items-center">
            <p className="text-[11px] text-slate-400">หน้า {currentPage} / {totalPages}</p>
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

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">สร้าง User</h3>
            <input
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="input input-bordered w-full mb-3 bg-slate-900 border-slate-700"
            />
            <input
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Password (อย่างน้อย 8 ตัว)"
              type="password"
              className="input input-bordered w-full mb-3 bg-slate-900 border-slate-700"
            />
            <input
              value={createForm.fullName}
              onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Full name (optional)"
              className="input input-bordered w-full mb-3 bg-slate-900 border-slate-700"
            />
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              className="select select-bordered w-full mb-4 bg-slate-900 border-slate-700"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">ยกเลิก</button>
              <button type="button" onClick={handleCreate} disabled={saving} className="btn btn-primary">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal + confirm */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">แก้ไข User</h3>
            <p className="text-xs text-slate-400 mb-2">{showEditModal.email}</p>
            <input
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Full name"
              className="input input-bordered w-full mb-3 bg-slate-900 border-slate-700"
            />
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              className="select select-bordered w-full mb-4 bg-slate-900 border-slate-700"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEditModal(null)} className="btn btn-ghost">ยกเลิก</button>
              <button
                type="button"
                onClick={() => setShowEditConfirm(true)}
                disabled={saving}
                className="btn btn-primary"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showEditConfirm}
        title="ยืนยันการแก้ไข"
        message="ต้องการบันทึกการเปลี่ยนแปลงของ user นี้หรือไม่?"
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        loading={saving}
        onConfirm={() => void handleEdit()}
        onCancel={() => setShowEditConfirm(false)}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="ลบ User"
        message={deleteConfirm ? <>ยืนยันการลบ {deleteConfirm.email}? การดำเนินการนี้ไม่สามารถย้อนกลับได้</> : ''}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="error"
        loading={saving}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
