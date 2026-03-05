import { useCallback } from 'react'
import { authApi } from '../services/authApi'
import { useAuthStore } from '../store/authStore'
import type { LoginPayload, RegisterPayload, AdminLoginPayload } from '../services/authApi'

export function useAuth() {
    const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth } =
        useAuthStore()

    // ─── Login ──────────────────────────────────────────────────
    const login = useCallback(async (payload: LoginPayload) => {
        const data = await authApi.login(payload)
        setAuth(data.user, data.accessToken)
        return data
    }, [setAuth])

    // ─── Admin Login ────────────────────────────────────────────
    const adminLogin = useCallback(async (payload: AdminLoginPayload) => {
        const data = await authApi.adminLogin(payload)
        setAuth(data.user, data.accessToken)
        return data
    }, [setAuth])

    // ─── Register ───────────────────────────────────────────────
    const register = useCallback(async (payload: RegisterPayload) => {
        // สมัครสมาชิกสำเร็จแล้ว แต่ยังไม่ถือว่า "ล็อกอิน"
        // ให้ผู้ใช้กลับไปหน้า login และเข้าสู่ระบบเอง
        const data = await authApi.register(payload)
        return data
    }, [])

    // ─── Logout ──────────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await authApi.logout()
        } finally {
            clearAuth()
        }
    }, [clearAuth])

    // ─── Silent Refresh (เรียกตอน app boot) ─────────────────────
    const silentRefresh = useCallback(async () => {
        const { setAuth: sa, clearAuth: ca, setLoading } = useAuthStore.getState()
        try {
            const { accessToken: newToken } = await authApi.refresh()
            const { user: me } = await authApi.getMe(newToken)
            sa(me, newToken)
        } catch {
            ca()
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        adminLogin,
        register,
        logout,
        silentRefresh,
    }
}
