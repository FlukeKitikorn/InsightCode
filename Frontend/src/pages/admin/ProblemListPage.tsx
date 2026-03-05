import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminProblemItem } from '../../services/adminApi'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

export default function ProblemListPage() {
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()
  const [problems, setProblems] = useState<AdminProblemItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminProblemItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    difficulty: 'EASY' as string,
    testCases: [] as Array<{ inputData: string; expectedOutput: string; isHidden: boolean }>,
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const loadProblems = async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const { problems: list } = await adminApi.listProblems(accessToken)
      setProblems(list)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'โหลดรายการโจทย์ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProblems()
  }, [accessToken])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return problems.filter((p) => {
      const matchSearch = !q || p.title.toLowerCase().includes(q)
      const matchDiff = diffFilter === 'all' || p.difficulty === diffFilter
      return matchSearch && matchDiff
    })
  }, [problems, search, diffFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const handleCreate = async () => {
    if (!accessToken || !createForm.title.trim() || !createForm.description.trim()) {
      toast.error('กรุณากรอก Title และ Description')
      return
    }
    try {
      setSaving(true)
      await adminApi.createProblem(accessToken, {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        difficulty: createForm.difficulty,
        testCases: createForm.testCases.length ? createForm.testCases.map((tc) => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })) : undefined,
      })
      toast.success('สร้างโจทย์เรียบร้อย')
      setShowCreateModal(false)
      setCreateForm({ title: '', description: '', difficulty: 'EASY', testCases: [] })
      void loadProblems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'สร้างโจทย์ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !deleteConfirm) return
    try {
      setSaving(true)
      await adminApi.deleteProblem(accessToken, deleteConfirm.id)
      toast.success('ลบโจทย์เรียบร้อย')
      setDeleteConfirm(null)
      void loadProblems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (!accessToken || !importFile) {
      toast.error('กรุณาเลือกไฟล์ JSON')
      return
    }
    try {
      setImporting(true)
      const text = await importFile.text()
      const data = JSON.parse(text) as { problems?: unknown[] }
      const list = Array.isArray(data.problems) ? data.problems : []
      if (list.length === 0) {
        toast.error('ไฟล์ต้องมี key "problems" เป็น array ไม่ว่าง')
        return
      }
      const payload = list.map((p: Record<string, unknown>) => ({
        title: String(p.title ?? ''),
        description: String(p.description ?? ''),
        difficulty: p.difficulty ? String(p.difficulty).toUpperCase() : undefined,
        testCases: Array.isArray(p.testCases)
          ? (p.testCases as Array<Record<string, unknown>>).map((tc) => ({
              inputData: tc.inputData != null ? String(tc.inputData) : undefined,
              expectedOutput: tc.expectedOutput != null ? String(tc.expectedOutput) : undefined,
              isHidden: Boolean(tc.isHidden),
            }))
          : undefined,
      }))
      const res = await adminApi.importProblems(accessToken, payload)
      toast.success(`Import เรียบร้อย ${res.imported} โจทย์`)
      setShowImportModal(false)
      setImportFile(null)
      void loadProblems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import ไม่สำเร็จ (ตรวจสอบรูปแบบ JSON)')
    } finally {
      setImporting(false)
    }
  }

  const addTestCase = () => {
    setCreateForm((f) => ({
      ...f,
      testCases: [...f.testCases, { inputData: '', expectedOutput: '', isHidden: true }],
    }))
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Problems</h1>
          <p className="text-sm text-slate-400">จัดการโจทย์ เพิ่ม/แก้ไข/ลบ/Import จากไฟล์</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowImportModal(true)} className="btn btn-outline btn-sm border-slate-600 gap-2">
            <span className="material-symbols-outlined text-base">upload_file</span>
            Import
          </button>
          <button type="button" onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm md:btn-md gap-2">
            <span className="material-symbols-outlined text-base">add</span>
            New problem
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder="Search by title..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7]/40"
          />
        </div>
        <select value={diffFilter} onChange={(e) => { setDiffFilter(e.target.value); setCurrentPage(1) }} className="select select-sm bg-slate-950 border-slate-700 text-xs">
          <option value="all">All difficulty</option>
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
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
                  {['Title', 'Difficulty', '#Testcases', 'Submissions', 'Created At', 'Action'].map((h) => (
                    <th key={h} className="px-4 md:px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-xs md:text-sm text-slate-100">{p.title}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.difficulty === 'EASY' ? 'bg-green-100 text-green-700' : p.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">{p.testcasesCount}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-300">{p.submissionsCount}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/problems/${p.id}`)}
                          className="btn btn-xs btn-ghost btn-circle text-slate-200 hover:text-white"
                          aria-label="Edit problem"
                          title="Edit problem"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <a
                          href={`/workspace/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-xs btn-ghost btn-circle text-slate-200 hover:text-white"
                          aria-label="Preview problem"
                          title="Preview in workspace"
                        >
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(p)}
                          className="btn btn-xs btn-ghost btn-circle text-red-400 hover:text-red-200"
                          aria-label="Delete problem"
                          title="Delete problem"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">No problems</td>
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
              <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="btn btn-ghost btn-xs"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="btn btn-ghost btn-xs"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-slate-100 mb-4">เพิ่มโจทย์</h3>
            <input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="input input-bordered w-full mb-3 bg-slate-900 border-slate-700" />
            <textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="textarea textarea-bordered w-full mb-3 bg-slate-900 border-slate-700 min-h-[100px]" />
            <select value={createForm.difficulty} onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value }))} className="select select-bordered w-full mb-3 bg-slate-900 border-slate-700">
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Test cases (optional)</span>
                <button type="button" onClick={addTestCase} className="btn btn-xs btn-ghost">+ Add</button>
              </div>
              {createForm.testCases.map((tc, i) => (
                <div key={i} className="flex flex-col gap-1 mb-2 p-2 bg-slate-900 rounded-lg">
                  <input value={tc.inputData} onChange={(e) => setCreateForm((f) => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, inputData: e.target.value } : t) }))} placeholder="Input" className="input input-sm bg-slate-950 border-slate-700" />
                  <input value={tc.expectedOutput} onChange={(e) => setCreateForm((f) => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, expectedOutput: e.target.value } : t) }))} placeholder="Expected output" className="input input-sm bg-slate-950 border-slate-700" />
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input type="checkbox" checked={tc.isHidden} onChange={(e) => setCreateForm((f) => ({ ...f, testCases: f.testCases.map((t, j) => j === i ? { ...t, isHidden: e.target.checked } : t) }))} />
                    Hidden
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">ยกเลิก</button>
              <button type="button" onClick={handleCreate} disabled={saving} className="btn btn-primary">{saving ? <span className="loading loading-spinner loading-sm" /> : 'สร้าง'}</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Import โจทย์จากไฟล์</h3>
            <p className="text-xs text-slate-400 mb-2">ใช้ไฟล์ JSON ที่มี key <code className="bg-slate-700 px-1 rounded">problems</code> เป็น array</p>
            <a
              href={URL.createObjectURL(new Blob([JSON.stringify({
                problems: [
                  { title: 'Two Sum', description: 'Given an array of integers and a target, return indices of the two numbers that add up to target.', difficulty: 'EASY', testCases: [{ inputData: '[2, 7, 11, 15]\n9', expectedOutput: '[0, 1]', isHidden: false }, { inputData: '[3, 2, 4]\n6', expectedOutput: '[1, 2]', isHidden: true }] },
                  { title: 'Reverse String', description: 'Reverse the input string.', difficulty: 'EASY', testCases: [{ inputData: '"hello"', expectedOutput: '"olleh"', isHidden: false }] },
                ],
              }, null, 2)], { type: 'application/json' }))}
              download="problems-import-template.json"
              className="link link-primary text-xs mb-3 inline-block"
            >
              ดาวน์โหลด template
            </a>
            <input type="file" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="file-input file-input-bordered w-full bg-slate-900 border-slate-700 mb-4" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowImportModal(false); setImportFile(null) }} className="btn btn-ghost">ยกเลิก</button>
              <button type="button" onClick={handleImport} disabled={!importFile || importing} className="btn btn-primary">{importing ? <span className="loading loading-spinner loading-sm" /> : 'Import'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="ลบโจทย์"
        message={deleteConfirm ? <>ยืนยันการลบ &quot;{deleteConfirm.title}&quot;?</> : ''}
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
