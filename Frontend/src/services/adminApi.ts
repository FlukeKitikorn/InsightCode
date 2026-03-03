const API_BASE = 'http://localhost:4000/api'

async function request<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
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

export const adminApi = {
  listUsers: (accessToken: string) =>
    request<{ users: AdminUserItem[] }>('/admin/users', accessToken),

  listProblems: (accessToken: string) =>
    request<{ problems: AdminProblemItem[] }>('/admin/problems', accessToken),

  listSubmissions: (accessToken: string, limit = 100) =>
    request<{ submissions: AdminSubmissionItem[] }>(
      `/admin/submissions?limit=${limit}`,
      accessToken,
    ),

  listAiFeedback: (accessToken: string) =>
    request<{ feedback: AdminAiFeedbackItem[] }>('/admin/ai-feedback', accessToken),
}

