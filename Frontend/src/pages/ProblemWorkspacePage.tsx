import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Page } from '../types'
import PageLayout from '../components/layout/PageLayout'
import { problemsApi } from '../services/problemsApi'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { submissionApi, type RunResult, type SubmissionItem } from '../services/submissionApi'

interface ProblemWorkspacePageProps {
  onNavigate: (page: Page) => void
}

export default function ProblemWorkspacePage({ onNavigate }: ProblemWorkspacePageProps) {
  const params = useParams()
  const problemId = params.id ?? null
  const { accessToken } = useAuthStore()

  type Lang = 'typescript' | 'javascript' | 'python' | 'cpp' | 'java' | 'go'

  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    problem: {
      id: string
      title: string
      description: string
      difficulty: string
      createdAt: string
      testCases: {
        id: number
        inputData: string | null
        expectedOutput: string | null
        isHidden: boolean
      }[]
    } | null
  }>({
    loading: true,
    error: null,
    problem: null,
  })

  const LANGUAGE_OPTIONS: { id: Lang; label: string }[] = [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'Java' },
    { id: 'go', label: 'Go' },
  ]

  const STARTER_CODE: Record<Lang, string> = {
    typescript: `export function solve(input: any): any {\n  // TODO: implement\n  return input\n}\n`,
    javascript: `function solve(input) {\n  // TODO: implement\n  return input\n}\n`,
    python: `def solve(input):\n    # TODO: implement\n    return input\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // TODO: implement\n  return 0;\n}\n`,
    java: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    // TODO: implement\n  }\n}\n`,
    go: `package main\n\nimport \"fmt\"\n\nfunc main() {\n  // TODO: implement\n  fmt.Println(\"Hello\")\n}\n`,
  }

  const [language, setLanguage] = useState<Lang>('typescript')
  const [activeTab, setActiveTab] = useState<'testcases' | 'output' | 'submissions'>('testcases')
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [codeByLang, setCodeByLang] = useState<Record<Lang, string>>(() => ({
    typescript: STARTER_CODE.typescript,
    javascript: STARTER_CODE.javascript,
    python: STARTER_CODE.python,
    cpp: STARTER_CODE.cpp,
    java: STARTER_CODE.java,
    go: STARTER_CODE.go,
  }))
  const [showProblemDrawer, setShowProblemDrawer] = useState(false)

  useEffect(() => {
    if (!problemId) {
      setState({ loading: false, error: 'Invalid workspace URL', problem: null })
      return
    }

    const load = async () => {
      try {
        const { problem } = await problemsApi.get(problemId)
        setState({ loading: false, error: null, problem })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load problem'
        setState({ loading: false, error: message, problem: null })
      }
    }

    void load()
  }, [problemId])

  const currentCode = () => codeByLang[language] ?? ''

  const loadSubmissions = async () => {
    if (!problemId || !accessToken) return
    try {
      const { submissions: list } = await submissionApi.listByProblem(problemId, accessToken)
      setSubmissions(list)
      if (!selectedSubmissionId && list.length > 0) setSelectedSubmissionId(list[0].id)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'โหลดประวัติการส่งโค้ดไม่สำเร็จ'
      toast.error(message)
    }
  }

  const pollAiFeedback = async (submissionId: string, attemptsLeft = 20) => {
    if (!problemId || !accessToken) return
    if (attemptsLeft <= 0) return
    await new Promise((resolve) => setTimeout(resolve, 2000))
    try {
      const { submissions: list } = await submissionApi.listByProblem(problemId, accessToken)
      setSubmissions(list)
      const target = list.find((s) => s.id === submissionId)
      if (!target) return
      if (target.aiFeedback?.analysisText) {
        toast.success('Updated AI feedback')
        return
      }
      await pollAiFeedback(submissionId, attemptsLeft - 1)
    } catch {
      // ถ้าดึงไม่สำเร็จให้หยุด polling เงียบ ๆ
    }
  }

  useEffect(() => {
    void loadSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, accessToken])

  const handleSelectSubmission = async (id: string) => {
    setSelectedSubmissionId(id)
    if (!accessToken) return
    try {
      const { submission } = await submissionApi.getById(id, accessToken)
      const rawLang = (submission.language ?? '').toLowerCase()
      const lang: Lang =
        rawLang === 'javascript' ||
        rawLang === 'typescript' ||
        rawLang === 'python' ||
        rawLang === 'cpp' ||
        rawLang === 'java' ||
        rawLang === 'go'
          ? (rawLang as Lang)
          : 'typescript'

      setLanguage(lang)
      setCodeByLang((prev) => ({
        ...prev,
        [lang]: submission.code ?? prev[lang],
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'โหลดรายละเอียด submission ไม่สำเร็จ'
      toast.error(message)
    }
  }

  const handleRun = async () => {
    if (!problemId || !accessToken) return
    setIsRunning(true)
    setActiveTab('output')
    const loadingId = toast.loading('กำลังรันกับ test cases...')
    try {
      const { run } = await submissionApi.run(
        { problemId, language, code: currentCode() },
        accessToken,
      )
      setRunResult(run)
      if (run.passedCount === run.totalCount && run.totalCount > 0) {
        toast.success('โค้ดของคุณผ่านทุก test case ที่เปิดให้ดูแล้ว!')
      } else {
        toast.success(`Run เสร็จแล้ว: ผ่าน ${run.passedCount}/${run.totalCount} test case`)
        // toast.success(`Run เสร็จแล้ว`)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'รันโค้ดไม่สำเร็จ'
      toast.error(message)
      setRunResult(null)
    } finally {
      toast.dismiss(loadingId)
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!problemId || !accessToken) return
    setIsSubmitting(true)
    const loadingId = toast.loading('กำลังส่งโค้ดและรอตรวจด้วย judge...')
    try {
      const res = await submissionApi.submit(
        { problemId, language, code: currentCode() },
        accessToken,
      )
      if (res.evaluation) {
        const { passedCount, totalCount } = res.evaluation
        if (passedCount === totalCount && totalCount > 0) {
          toast.success('ส่งสำเร็จ! โค้ดของคุณผ่านทุก test case แล้ว')
        } else {
          // toast.success(`ส่งสำเร็จ`)
          toast.success(`ส่งสำเร็จ: ผ่าน ${passedCount}/${totalCount} test case`)
        }
      } else {
        toast.success(res.message ?? 'ส่งโค้ดสำเร็จ')
      }
      await loadSubmissions()
      if (res.submission?.id) {
        void pollAiFeedback(res.submission.id)
      }
      setActiveTab('submissions')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'ส่งโค้ดไม่สำเร็จ'
      toast.error(message)
    } finally {
      toast.dismiss(loadingId)
      setIsSubmitting(false)
    }
  }

  const difficultyBadge = (difficulty: string) => {
    const diff = difficulty.toUpperCase()
    if (diff === 'HARD') return 'badge badge-error gap-1'
    if (diff === 'MEDIUM') return 'badge badge-warning gap-1'
    return 'badge badge-success gap-1'
  }

  const difficultyLabel = (difficulty: string) => {
    const diff = String(difficulty).toUpperCase()
    if (diff === 'HARD') return 'Hard'
    if (diff === 'MEDIUM') return 'Medium'
    return 'Easy'
  }

  return (
    <PageLayout currentPage="workspace" onNavigate={onNavigate} fullScreen>
      <main className="flex-1 flex flex-col min-h-0 bg-[#0b0e14] text-slate-100 overflow-hidden">
        {/* Top bar with breadcrumbs — responsive: wrap, truncate, icon-only back on small */}
        <header className="shrink-0 h-12 min-h-12 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-800 bg-[#050812]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="breadcrumbs text-xs text-slate-400 min-w-0 overflow-hidden">
              <ul className="flex items-center gap-1 truncate">
                <li className="truncate">
                  <button
                    type="button"
                    onClick={() => onNavigate('problems')}
                    className="hover:text-white truncate"
                  >
                    Problems
                  </button>
                </li>
                <li className="truncate">Workspace</li>
                {state.problem && (
                  <li className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" title={state.problem.title}>
                    {state.problem.title}
                  </li>
                )}
              </ul>
            </div>
            {/* Mobile: ปุ่มเปิดโจทย์ (ซ่อนเมื่อมี aside โจทย์อยู่แล้ว) */}
            {!state.loading && state.problem && (
              <button
                type="button"
                onClick={() => setShowProblemDrawer(true)}
                className="md:hidden btn btn-xs btn-ghost text-slate-300 border border-slate-600 shrink-0"
                title="ดูโจทย์"
              >
                <span className="material-symbols-outlined text-sm">description</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('problems')}
            className="btn btn-xs btn-ghost text-slate-300 border border-slate-700 shrink-0"
            title="กลับไปรายการโจทย์"
          >
            <span className="material-symbols-outlined text-sm sm:mr-1">arrow_back</span>
            <span className="hidden sm:inline">Back</span>
          </button>
        </header>

        {/* Loading / Error */}
        {state.loading && (
          <div className="flex-1 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}
        {!state.loading && state.error && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="alert alert-error max-w-md">
              <span>{state.error}</span>
            </div>
          </div>
        )}

        {/* Main workspace when problem loaded */}
        {!state.loading && state.problem && (
          <div className="flex flex-1 min-h-0 overflow-hidden w-full">
            {/* Left: problem description (hidden on small; use drawer instead) */}
            <aside className="hidden md:flex md:flex-col md:w-[320px] lg:w-[360px] shrink-0 border-r border-slate-800 bg-[#020617] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h1 className="text-sm font-semibold text-slate-100">{state.problem.title}</h1>
                  <p className="text-[11px] text-slate-500">
                    Created at {new Date(state.problem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={difficultyBadge(state.problem.difficulty)}>
                  <span className="material-symbols-outlined text-[14px]">
                    {state.problem.difficulty.toUpperCase() === 'HARD'
                      ? 'warning'
                      : state.problem.difficulty.toUpperCase() === 'MEDIUM'
                      ? 'stacked_bar_chart'
                      : 'check_circle'}
                  </span>
                  <span className="text-[10px] font-bold">
                    {difficultyLabel(state.problem.difficulty)}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-200">
                <p className="whitespace-pre-line leading-relaxed">
                  {state.problem.description}
                </p>
              </div>
              <div className="px-5 py-3 border-t border-slate-800 text-[11px] text-slate-500">
                Based on real problem data from the database.
              </div>
            </aside>

            {/* Middle: editor + bottom panel */}
            <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#020617]">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-800 bg-[#020617]">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-200 font-semibold">
                    <span className="material-symbols-outlined text-base sm:text-[18px] text-slate-400">code</span>
                    <span>Editor</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Lang)}
                    className="select select-sm select-bordered bg-slate-900 border-slate-700 text-slate-100 max-w-[130px] sm:max-w-none"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="btn btn-sm btn-outline border-slate-600 text-slate-100 hover:bg-slate-800"
                  >
                    {isRunning ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <span className="material-symbols-outlined text-base sm:text-[18px]">play_arrow</span>
                    )}
                    <span className="hidden sm:inline">Run</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn btn-sm btn-primary"
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <span className="material-symbols-outlined text-base sm:text-[18px]">upload</span>
                    )}
                    <span className="hidden sm:inline">Submit</span>
                  </button>
                </div>
              </div>

              {/* Editor: ความสูงยืดหยุ่น มี min/max — จอเล็กจะหดให้กล่อง testcase มีที่ เลื่อนได้, CodeMirror เลื่อนในตัวเอง */}
              <div className="shrink min-h-[100px] max-h-[240px] sm:max-h-[280px] md:max-h-[320px] basis-[240px] sm:basis-[280px] md:basis-[320px]">
                <div className="h-full w-full overflow-auto rounded-b-lg border-b border-slate-800">
                  <CodeMirror
                    value={codeByLang[language]}
                    height="100%"
                    theme="dark"
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: true,
                    }}
                    extensions={
                      language === 'typescript'
                        ? [javascript({ typescript: true })]
                        : language === 'javascript'
                        ? [javascript()]
                        : language === 'python'
                        ? [python()]
                        : language === 'java'
                        ? [java()]
                        : language === 'cpp'
                        ? [cpp()]
                        : language === 'go'
                        ? [go()]
                        : []
                    }
                    onChange={(value) =>
                      setCodeByLang((prev) => ({
                        ...prev,
                        [language]: value,
                      }))
                    }
                    className="h-full text-sm"
                  />
                </div>
              </div>

              {/* Bottom panel: รับพื้นที่ที่เหลือ + เลื่อนได้ (min-h-0 ให้ flex หดได้เมื่อจอเล็กมาก) */}
              <div className="flex-1 min-h-0 flex flex-col border-t border-slate-800 bg-[#050812] overflow-hidden">
                <div className="shrink-0 px-2 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="tabs tabs-boxed bg-slate-900/40 flex flex-wrap">
                    <button
                      type="button"
                      className={`tab text-xs sm:text-sm ${activeTab === 'testcases' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('testcases')}
                    >
                      Testcases
                    </button>
                    <button
                      type="button"
                      className={`tab text-xs sm:text-sm ${activeTab === 'output' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('output')}
                    >
                      Output
                    </button>
                    <button
                      type="button"
                      className={`tab text-xs sm:text-sm ${activeTab === 'submissions' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('submissions')}
                    >
                      Submissions
                    </button>
                  </div>
                  {runResult && (
                    <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span>
                        Run:{' '}
                        <span className="font-semibold text-slate-200">
                          {runResult.passedCount}/{runResult.totalCount}
                        </span>{' '}
                        · {runResult.executionTimeMs}ms
                      </span>
                      {runResult.totalCount > 0 && runResult.passedCount === runResult.totalCount && (
                        <span className="text-emerald-400 font-semibold">
                          ผ่านทุก test case แล้ว ✓
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pb-4">
                  {activeTab === 'testcases' && (
                    <div className="space-y-3 text-sm">
                      {state.problem.testCases.filter((t) => !t.isHidden).length === 0 ? (
                        <p className="text-slate-500 text-sm">No visible test cases.</p>
                      ) : (
                        state.problem.testCases
                          .filter((t) => !t.isHidden)
                          .map((tc, index) => (
                            <div key={tc.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-1">
                              <p className="font-semibold text-slate-100">Case #{index + 1}</p>
                              <p className="text-slate-300">
                                <span className="font-semibold">Input:</span>{' '}
                                <span className="font-mono">{tc.inputData ?? '—'}</span>
                              </p>
                              <p className="text-slate-300">
                                <span className="font-semibold">Expected:</span>{' '}
                                <span className="font-mono">{tc.expectedOutput ?? '—'}</span>
                              </p>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {activeTab === 'output' && (
                    <div className="space-y-3 text-sm">
                      {!runResult ? (
                        <p className="text-slate-500">Run เพื่อดูผลลัพธ์ (รองรับ JS/TS ก่อน)</p>
                      ) : (
                        runResult.results.map((r, index) => (
                          <div key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-100">Case #{index + 1}</p>
                              <span className={`badge badge-sm ${r.passed ? 'badge-success' : 'badge-error'}`}>
                                {r.passed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                            {r.error && <p className="text-red-300 mt-2 text-xs">Error: {r.error}</p>}
                            {!r.isHidden && (
                              <div className="mt-2 text-xs text-slate-300 space-y-1">
                                <p><span className="font-semibold">Expected:</span> <span className="font-mono">{JSON.stringify(r.expected)}</span></p>
                                <p><span className="font-semibold">Actual:</span> <span className="font-mono">{JSON.stringify(r.actual)}</span></p>
                              </div>
                            )}
                            {r.logs.length > 0 && (
                              <div className="mt-2 text-xs">
                                <p className="font-semibold text-slate-200 mb-1">Console</p>
                                <pre className="bg-black/40 border border-slate-700 rounded-lg p-2 overflow-x-auto text-slate-200">{r.logs.join('\n')}</pre>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'submissions' && (
                    <div className="space-y-2 text-sm">
                      {submissions.length === 0 ? (
                        <p className="text-slate-500">No submissions yet.</p>
                      ) : (
                    submissions.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => void handleSelectSubmission(s.id)}
                            className={`w-full text-left rounded-xl border px-3 py-2 cursor-pointer
                              transition-all duration-200 ease-out
                              transform active:scale-[0.98]
                              ${
                                selectedSubmissionId === s.id
                                  ? 'border-[#5586e7] bg-[#5586e7]/10 shadow-md shadow-[#5586e7]/20 scale-[1.01]'
                                  : s.status === 'accepted'
                                    ? 'border-emerald-500/70 bg-emerald-900/30 hover:bg-emerald-900/50 hover:border-emerald-400 hover:shadow-sm hover:shadow-emerald-800/40 hover:scale-[1.01]'
                                    : s.status === 'wrong_answer'
                                      ? 'border-rose-500/70 bg-rose-900/30 hover:bg-rose-900/50 hover:border-rose-400 hover:shadow-sm hover:shadow-rose-800/40 hover:scale-[1.01]'
                                      : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-500 hover:shadow-sm hover:shadow-slate-800/50 hover:scale-[1.01]'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold flex items-center gap-1 ${
                                    s.status === 'accepted'
                                      ? 'text-emerald-300'
                                      : s.status === 'wrong_answer'
                                        ? 'text-rose-300'
                                        : 'text-amber-200'
                                  }`}
                                >
                                  {s.status === 'accepted' && (
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                  )}
                                  {s.status === 'wrong_answer' && (
                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                  )}
                                  {s.status !== 'accepted' && s.status !== 'wrong_answer' && (
                                    <span className="material-symbols-outlined text-sm">hourglass_top</span>
                                  )}
                                  {s.status.toUpperCase()}
                                </span>
                                <span className="badge badge-outline badge-sm text-slate-200">{(s.language ?? '—').toUpperCase()}</span>
                                {s.executionTime != null && <span className="text-xs text-slate-400">{s.executionTime}ms</span>}
                              </div>
                              <span className="text-xs text-slate-400">
                                {new Date(s.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {s.aiFeedback?.qualityScore != null && (
                              <p className="text-xs text-slate-400 mt-1">
                                AI score: <span className="text-slate-200 font-semibold">{Math.round(s.aiFeedback.qualityScore)}</span>
                              </p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Right: AI panel (hidden on small/medium) */}
            <aside className="hidden lg:flex lg:flex-col lg:w-[320px] xl:w-[360px] shrink-0 border-l border-slate-800 bg-[#020617] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5586e7]">auto_awesome</span>
                  <span className="text-sm font-semibold text-slate-100">AI Analysis</span>
                </div>
                <span className="badge badge-outline text-slate-200">after submit</span>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {(() => {
                  const selected = submissions.find((s) => s.id === selectedSubmissionId) ?? submissions[0]
                  if (!selected) {
                    return <p className="text-sm text-slate-500">Submit code to get AI feedback.</p>
                  }
                  if (!selected.aiFeedback?.analysisText) {
                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-300 font-semibold">Submission #{selected.id.slice(0, 8)}</p>
                        <p className="text-sm text-slate-500">No AI feedback yet for this submission.</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-100">Submission #{selected.id.slice(0, 8)}</p>
                        {selected.aiFeedback.qualityScore != null && (
                          <span className="badge badge-primary">
                            Score {Math.round(selected.aiFeedback.qualityScore)}
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap text-xs text-slate-200 bg-black/30 border border-slate-800 rounded-xl p-3">
                        {selected.aiFeedback.analysisText}
                      </pre>
                      <div className="text-xs text-slate-500">
                        Generated at {new Date(selected.aiFeedback.createdAt).toLocaleString()}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </aside>
          </div>
        )}

        {/* Mobile drawer: โจทย์ (แสดงเมื่อกดปุ่มโจทย์บนจอเล็ก) */}
        {state.problem && showProblemDrawer && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[#0b0e14]">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#050812]">
              <span className="text-sm font-semibold text-slate-100">โจทย์</span>
              <button
                type="button"
                onClick={() => setShowProblemDrawer(false)}
                className="btn btn-sm btn-ghost text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-200">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-base font-semibold text-slate-100">{state.problem.title}</h1>
                <div className={difficultyBadge(state.problem.difficulty)}>
                  <span className="text-[10px] font-bold">{difficultyLabel(state.problem.difficulty)}</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs">
                Created at {new Date(state.problem.createdAt).toLocaleDateString()}
              </p>
              <p className="whitespace-pre-line leading-relaxed">
                {state.problem.description}
              </p>
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  )
}

