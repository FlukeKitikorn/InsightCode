const API_BASE = 'http://localhost:4000/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatPayload {
  problemId?: string
  message: string
  history?: ChatMessage[]
}

export interface ChatResponse {
  reply: string
}

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
    const msg = data.message || 'Something went wrong'
    if (res.status === 401 && msg === 'Invalid or expired access token') {
      window.dispatchEvent(new CustomEvent('insightcode:auth-expired'))
    }
    throw new Error(msg)
  }
  return data as T
}

export const chatApi = {
  send: (accessToken: string, payload: ChatPayload) =>
    request<ChatResponse>('/users/me/chat', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
