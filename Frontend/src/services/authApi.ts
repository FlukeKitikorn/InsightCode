// ─── Types ────────────────────────────────────────────────────
export interface AuthUser {
    id: string
    email: string
    role: string
    fullName: string | null
    avatarUrl: string | null
    createdAt: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    password: string
    fullName?: string
}

export interface AdminLoginPayload {
    email: string
    password: string
    adminCode: string
}

export interface AuthResponse {
    message: string
    accessToken: string
    user: AuthUser
}

export interface RefreshResponse {
    accessToken: string
}

export interface UpdateProfilePayload {
    fullName?: string
    avatarUrl?: string
}

export interface UserProgress {
    totalProblems: number
    solvedTotal: number
    attemptedTotal: number
    totalsByDifficulty: { EASY: number; MEDIUM: number; HARD: number }
    solvedByDifficulty: { EASY: number; MEDIUM: number; HARD: number }
    attemptedByDifficulty: { EASY: number; MEDIUM: number; HARD: number }
    masteryByDifficulty: { EASY: number; MEDIUM: number; HARD: number }
  solvedProblemIds: string[]
  attemptedProblemIds: string[]
}

export interface InsightItem {
    id: string
    problemTitle: string | null
    difficulty: string | null
    language: string | null
    status: string
    executionTime: number | null
    createdAt: string
    qualityScore: number | null
    analysisText: string | null
}

export interface InsightsResponse {
    insights: InsightItem[]
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
}

// ─── API Base ─────────────────────────────────────────────────
const API_BASE = 'http://localhost:4000/api'

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include', // ส่ง cookie (refresh token) ไปด้วยทุก request
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
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

// ─── Auth API Functions ────────────────────────────────────────
export const authApi = {
    register: (payload: RegisterPayload) =>
        request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    login: (payload: LoginPayload) =>
        request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    adminLogin: (payload: AdminLoginPayload) =>
        request<AuthResponse>('/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    refresh: () =>
        request<RefreshResponse>('/auth/refresh', {
            method: 'POST',
        }),

    logout: () =>
        request<{ message: string }>('/auth/logout', {
            method: 'POST',
        }),

    getMe: (accessToken: string) =>
        request<{ user: AuthUser }>('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),

    updateProfile: (payload: UpdateProfilePayload, accessToken: string) =>
        request<{ user: AuthUser }>('/users/me', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify(payload),
        }),

    getProgress: (accessToken: string) =>
        request<{ progress: UserProgress }>('/users/me/progress', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),

    getMyInsights: (accessToken: string, page = 1, pageSize = 10) =>
        request<InsightsResponse>(`/users/me/insights?page=${page}&pageSize=${pageSize}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),
}
