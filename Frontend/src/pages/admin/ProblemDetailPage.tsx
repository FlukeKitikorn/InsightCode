import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminApi, type AdminProblemDetail } from '../../services/adminApi'
import ConfirmModal from '../../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

type TestCaseRow = { id: number; inputData: string; expectedOutput: string; isHidden: boolean }

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()
  const [problem, setProblem] = useState<AdminProblemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'EASY' as string,
    testCases: [] as TestCaseRow[],
  })

  useEffect(() => {
    if (!accessToken || !id) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const { problem: p } = await adminApi.getProblem(accessToken, id)
        if (!cancelled) {
          setProblem(p)
          setForm({
            title: p.title,
            description: p.description,
            difficulty: p.difficulty,
            testCases: (p.testCases ?? []).map((tc) => ({
              id: tc.id,
              inputData: tc.inputData ?? '',
              expectedOutput: tc.expectedOutput ?? '',
              isHidden: tc.isHidden,
            })),
          })
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'โหลดโจทย์ไม่สำเร็จ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [accessToken, id])

  const addTestCase = () => {
    setForm((f) => ({
      ...f,
      testCases: [...f.testCases, { id: 0, inputData: '', expectedOutput: '', isHidden: true }],
    }))
  }

  const removeTestCase = (index: number) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, i) => i !== index),
    }))
  }

  const updateTestCase = (index: number, field: keyof TestCaseRow, value: string | boolean) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }))
  }

  const handleSave = async () => {
    if (!accessToken || !id || !form.title.trim() || !form.description.trim()) {
      toast.error('กรุณากรอก Title และ Description')
      return
    }
    try {
      setSaving(true)
      await adminApi.updateProblem(accessToken, id, {
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        testCases: form.testCases.map((tc) => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
      })
      toast.success('บันทึกเรียบร้อย')
      setShowConfirm(false)
      navigate('/admin/problems')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !problem) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[200px]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!id || (!loading && !problem)) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-slate-400">โจทย์ไม่พบ</p>
        <button type="button" onClick={() => navigate('/admin/problems')} className="btn btn-ghost btn-sm mt-2">กลับ</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Edit problem</h1>
          <p className="text-sm text-slate-400">แก้ไขโจทย์ ความยาก และ test cases</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/admin/problems')} className="btn btn-sm md:btn-md btn-ghost border border-slate-700">
            ยกเลิก
          </button>
          <button type="button" onClick={() => setShowConfirm(true)} className="btn btn-sm md:btn-md btn-primary gap-1">
            <span className="material-symbols-outlined text-sm">save</span>
            บันทึก
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <div>
                <label className="label"><span className="label-text text-xs font-semibold text-slate-300">Title</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input input-sm md:input-md input-bordered w-full bg-slate-950 border-slate-700"
                />
              </div>
              <div>
                <label className="label"><span className="label-text text-xs font-semibold text-slate-300">Difficulty</span></label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  className="select select-sm w-full bg-slate-950 border-slate-700"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body space-y-3">
              <h2 className="card-title text-base">Description</h2>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="textarea textarea-bordered bg-slate-950 border-slate-700 text-sm leading-relaxed min-h-[220px]"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card bg-slate-900/70 border border-slate-800">
            <div className="card-body">
              <p className="text-xs text-slate-400">Submissions: {problem?.submissionsCount ?? 0}</p>
              <p className="text-xs text-slate-400">Test cases: {form.testCases.length}</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Test cases</h2>
          <button type="button" onClick={addTestCase} className="btn btn-xs btn-outline border-slate-700 text-slate-200">
            <span className="material-symbols-outlined text-xs mr-1">add</span>
            Add testcase
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.testCases.map((tc, index) => (
            <div key={tc.id || index} className="card bg-slate-900/70 border border-slate-800">
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Case #{index + 1}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <label className="label cursor-pointer gap-1">
                      <span>Hidden</span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={tc.isHidden}
                        onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                      />
                    </label>
                    <button type="button" onClick={() => removeTestCase(index)} className="btn btn-ghost btn-xs text-slate-400">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <label className="label"><span className="label-text text-[11px] text-slate-400">Input</span></label>
                <textarea
                  value={tc.inputData}
                  onChange={(e) => updateTestCase(index, 'inputData', e.target.value)}
                  className="textarea textarea-xs bg-slate-950 border-slate-700 text-xs font-mono"
                  rows={2}
                />
                <label className="label"><span className="label-text text-[11px] text-slate-400">Expected</span></label>
                <textarea
                  value={tc.expectedOutput}
                  onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                  className="textarea textarea-xs bg-slate-950 border-slate-700 text-xs font-mono"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal
        open={showConfirm}
        title="ยืนยันการแก้ไข"
        message="ต้องการบันทึกการเปลี่ยนแปลงหรือไม่?"
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        loading={saving}
        onConfirm={() => void handleSave()}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
