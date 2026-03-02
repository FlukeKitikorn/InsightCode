import { create } from 'zustand'
import type { AuthUser } from '../services/authApi'

interface AuthState {
    // State
    user: AuthUser | null
    accessToken: string | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    setAuth: (user: AuthUser, accessToken: string) => void
    setAccessToken: (token: string) => void
    updateUser: (user: AuthUser) => void
    clearAuth: () => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,  // true เพื่อรอ silent refresh ตอน app boot

    setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),

    setAccessToken: (token) =>
        set({ accessToken: token }),

    updateUser: (user) =>
        set((state) => ({
            user,
            isAuthenticated: state.isAuthenticated,
        })),

    clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),

    setLoading: (loading) =>
        set({ isLoading: loading }),
}))
