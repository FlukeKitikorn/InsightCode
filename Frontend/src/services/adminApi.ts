const API_BASE = 'http://localhost:4000/api'

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers as Record<string, string>),
    },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    const message = data.message || 'Something went wrong'
    if (res.status === 401 && message === 'Invalid or expired access token') {
      window.dispatchEvent(new CustomEvent('insightcode:auth-expired'))
    }
    throw new Error(message)
  }
  return data as T
}

export interface AdminUserItem {
  id: string
  email: string
  fullName: string | null
  role: string
  avatarUrl: string | null
  createdAt: string
  submissionsCount: number
}

export interface AdminProblemItem {
  id: string
  title: string
  description: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  createdAt: string
  testcasesCount: number
  submissionsCount: number
}

export interface AdminProblemDetail extends AdminProblemItem {
  testCases: Array<{ id: number; inputData: string; expectedOutput: string; isHidden: boolean }>
}

export interface AdminSubmissionItem {
  id: string
  userEmail: string | null
  problemTitle: string | null
  language: string | null
  status: string
  executionTime: number | null
  createdAt: string
}

export interface AdminAiFeedbackItem {
  id: number
  createdAt: string
  analysisText: string | null
  qualityScore: number | null
  language: string | null
  status: string
  problemTitle: string | null
}

export interface AdminStats {
  usersCount: number
  problemsCount: number
  submissionsCount: number
  aiFeedbackCount: number
}

export const adminApi = {
  getStats: (accessToken: string) =>
    request<AdminStats>('/admin/stats', accessToken),

  getLogs: (accessToken: string) =>
    request<{ logs: string[] }>('/admin/logs', accessToken),

  listUsers: (accessToken: string) =>
    request<{ users: AdminUserItem[] }>('/admin/users', accessToken),

  listProblems: (accessToken: string) =>
    request<{ problems: AdminProblemItem[] }>('/admin/problems', accessToken),

  getProblem: (accessToken: string, problemId: string) =>
    request<{ problem: AdminProblemDetail }>(`/admin/problems/${problemId}`, accessToken),

  createProblem: (accessToken: string, payload: { title: string; description: string; difficulty?: string; testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }> }) =>
    request<{ problem: AdminProblemItem }>('/admin/problems', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProblem: (accessToken: string, problemId: string, payload: { title?: string; description?: string; difficulty?: string; testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }> }) =>
    request<{ problem: AdminProblemDetail }>(`/admin/problems/${problemId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProblem: (accessToken: string, problemId: string) =>
    request<{ message: string }>(`/admin/problems/${problemId}`, accessToken, { method: 'DELETE' }),

  importProblems: (accessToken: string, problems: Array<{ title: string; description: string; difficulty?: string; testCases?: Array<{ inputData?: string; expectedOutput?: string; isHidden?: boolean }> }>) =>
    request<{ imported: number; problems: Array<{ id: string; title: string }> }>('/admin/problems/import', accessToken, {
      method: 'POST',
      body: JSON.stringify({ problems }),
    }),

  listSubmissions: (accessToken: string, limit = 100) =>
    request<{ submissions: AdminSubmissionItem[] }>(
      `/admin/submissions?limit=${limit}`,
      accessToken,
    ),

  listAiFeedback: (accessToken: string) =>
    request<{ feedback: AdminAiFeedbackItem[] }>('/admin/ai-feedback', accessToken),

  createAnnouncement: (
    accessToken: string,
    payload: { title: string; body: string; type?: string }
  ) =>
    request<{ announcement: { id: number; title: string; body: string; type: string; createdAt: string } }>(
      '/admin/announcements',
      accessToken,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  createUser: (accessToken: string, payload: { email: string; password: string; fullName?: string; role?: string }) =>
    request<{ user: AdminUserItem }>('/admin/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (accessToken: string, userId: string, payload: { fullName?: string; avatarUrl?: string; role?: string }) =>
    request<{ user: AdminUserItem }>(`/admin/users/${userId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteUser: (accessToken: string, userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}`, accessToken, {
      method: 'DELETE',
    }),
}

