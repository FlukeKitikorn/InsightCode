const API_BASE = 'http://localhost:4000/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as any).message || 'Something went wrong'
    if (res.status === 401 && message === 'Invalid or expired access token') {
      window.dispatchEvent(new CustomEvent('insightcode:auth-expired'))
    }
    throw new Error(message)
  }

  return data as T
}

export type SubmissionStatus = 'pending' | 'accepted' | 'wrong_answer'

export interface SubmissionItem {
  id: string
  language: string | null
  status: SubmissionStatus
  executionTime: number | null
  createdAt: string
  aiFeedback?: {
    analysisText: string | null
    qualityScore: number | null
    createdAt: string
  } | null
}

export interface RunResult {
  problem: { id: string; title: string }
  passedCount: number
  totalCount: number
  executionTimeMs: number
  results: Array<{
    id: number
    passed: boolean
    actual: unknown
    expected: unknown
    isHidden: boolean
    logs: string[]
    error?: string
  }>
}

export interface SubmissionDetail {
  id: string
  problemId: string | null
  language: string | null
  code: string
  status: SubmissionStatus
  executionTime: number | null
  createdAt: string
}

export const submissionApi = {
  listByProblem: (problemId: string, accessToken: string) =>
    request<{ submissions: SubmissionItem[] }>(`/submissions?problemId=${encodeURIComponent(problemId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  run: (payload: { problemId: string; language: string; code: string }, accessToken: string) =>
    request<{ run: RunResult }>(`/submissions/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    }),

  submit: (payload: { problemId: string; language: string; code: string }, accessToken: string) =>
    request<{
      submission: { id: string; language: string | null; status: string; executionTime?: number | null; createdAt: string }
      evaluation?: { passedCount: number; totalCount: number; executionTimeMs: number }
      aiFeedback?: { analysisText: string | null; qualityScore: number | null; createdAt: string }
      message?: string
    }>(`/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    }),

  getById: (id: string, accessToken: string) =>
    request<{ submission: SubmissionDetail }>(`/submissions/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
}

