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
      const message = e instanceof Error ? e.message : 'Failed to load submissions'
      toast.error(message)
    }
  }

  useEffect(() => {
    void loadSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, accessToken])

  const handleRun = async () => {
    if (!problemId || !accessToken) return
    setIsRunning(true)
    setActiveTab('output')
    try {
      const { run } = await submissionApi.run(
        { problemId, language, code: currentCode() },
        accessToken,
      )
      setRunResult(run)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Run failed'
      toast.error(message)
      setRunResult(null)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!problemId || !accessToken) return
    setIsSubmitting(true)
    try {
      const res = await submissionApi.submit(
        { problemId, language, code: currentCode() },
        accessToken,
      )
      if (res.evaluation) {
        toast.success(`Submitted: ${res.evaluation.passedCount}/${res.evaluation.totalCount} passed`)
      } else {
        toast.success(res.message ?? 'Submitted')
      }
      await loadSubmissions()
      setActiveTab('submissions')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Submit failed'
      toast.error(message)
    } finally {
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
      <main className="flex-1 flex flex-col bg-[#0b0e14] text-slate-100">
        {/* Top bar with breadcrumbs */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-[#050812]">
          <div className="breadcrumbs text-xs text-slate-400">
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('problems')}
                  className="hover:text-white"
                >
                  Problems
                </button>
              </li>
              <li>Workspace</li>
              {state.problem && <li>{state.problem.title}</li>}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('problems')}
            className="btn btn-xs btn-ghost text-slate-300 border border-slate-700"
          >
            <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
            Back
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
          <div className="flex flex-1 overflow-hidden">
            {/* Left: problem description */}
            <aside className="hidden md:flex md:flex-col w-[360px] border-r border-slate-800 bg-[#020617]">
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
            <section className="flex-1 flex flex-col min-w-0 bg-[#020617]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#020617]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-200 font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">code</span>
                    <span>Editor</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Lang)}
                    className="select select-sm bg-slate-900 border-slate-700 text-slate-100"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isRunning}
                    className="btn btn-sm btn-outline border-slate-600 text-slate-100 hover:bg-slate-800"
                  >
                    {isRunning ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    )}
                    Run
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
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                    )}
                    Submit
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <div className="h-full">
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

              {/* Bottom panel: testcases / output / submissions */}
              <div className="border-t border-slate-800 bg-[#050812]">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="tabs tabs-boxed bg-slate-900/40">
                    <button
                      type="button"
                      className={`tab ${activeTab === 'testcases' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('testcases')}
                    >
                      Testcases
                    </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'output' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('output')}
                    >
                      Output
                    </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'submissions' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('submissions')}
                    >
                      Submissions
                    </button>
                  </div>
                  {runResult && (
                    <div className="text-xs text-slate-400">
                      Run: <span className="font-semibold text-slate-200">{runResult.passedCount}/{runResult.totalCount}</span> · {runResult.executionTimeMs}ms
                    </div>
                  )}
                </div>

                <div className="max-h-[260px] overflow-y-auto px-4 pb-4">
                  {activeTab === 'testcases' && (
                    <div className="space-y-3 text-sm">
                      {state.problem.testCases.filter((t) => !t.isHidden).length === 0 ? (
                        <p className="text-slate-500 text-sm">No visible test cases.</p>
                      ) : (
                        state.problem.testCases
                          .filter((t) => !t.isHidden)
                          .map((tc) => (
                            <div key={tc.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-1">
                              <p className="font-semibold text-slate-100">Case #{tc.id}</p>
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
                        runResult.results.map((r) => (
                          <div key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-100">Case #{r.id}</p>
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
                            onClick={() => setSelectedSubmissionId(s.id)}
                            className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${selectedSubmissionId === s.id
                              ? 'border-[#5586e7] bg-[#5586e7]/10'
                              : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-100">{s.status.toUpperCase()}</span>
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

            {/* Right: AI panel */}
            <aside className="hidden lg:flex lg:flex-col w-[360px] border-l border-slate-800 bg-[#020617]">
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
      </main>
    </PageLayout>
  )
}

