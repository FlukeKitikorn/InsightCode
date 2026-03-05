export interface ProblemSummary {
  id: string
  title: string
  difficulty: string
  createdAt: string
  acceptance?: string | null
}

interface ListProblemsResponse {
  problems: ProblemSummary[]
}

const API_BASE = 'http://localhost:4000/api'

interface GetProblemResponse {
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
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data as T
}

export const problemsApi = {
  list: (accessToken?: string) =>
    request<ListProblemsResponse>('/problems', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),
  get: (id: string, accessToken?: string) =>
    request<GetProblemResponse>(`/problems/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),
}

