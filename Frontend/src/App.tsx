import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Page } from './types'
import { useAuthStore } from './store/authStore'
import { authApi } from './services/authApi'
import toast from 'react-hot-toast'
import AuthPage from './pages/AuthPage'
import ProblemExplorerPage from './pages/ProblemExplorerPage'
import ProblemWorkspacePage from './pages/ProblemWorkspacePage'
import AiAnalyticsPage from './pages/AiAnalyticsPage'
import { useLoading } from './contexts/LoadingContext'
import UserProfilePage from './pages/UserProfilePage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminPage from './pages/admin/AdminPage'
import ApiDocsPage from './pages/ApiDocsPage'
import SystemDiagramsPage from './pages/SystemDiagramsPage'

export default function App() {
  const navigate = useNavigate()
  useLocation()
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading, user } = useAuthStore()
  const { setLoading: setPageLoading } = useLoading()

  // ─── Silent Refresh on App Boot ───────────────────────────────
  // เมื่อ user reload → accessToken หายจาก memory
  // แต่ refreshToken ยังอยู่ใน HttpOnly Cookie → ขอใหม่โดยอัตโนมัติ
  useEffect(() => {
    const tryRefresh = async () => {
      const path = window.location.pathname
      const isPublic = path.startsWith('/api/docs') || path.startsWith('/system/diagrams')
      if (isPublic) {
        // สำหรับหน้า public docs/diagrams ให้ข้ามการ refresh และ login flow ทั้งหมด
        setLoading(false)
        return
      }
      try {
        const { accessToken } = await authApi.refresh()
        const { user } = await authApi.getMe(accessToken)
        setAuth(user, accessToken)
        // ถ้าอยู่ root ให้ไป problems; ถ้า deep-link มา (workspace/profile/...) ให้ค้างไว้
        if (window.location.pathname === '/') navigate('/problems', { replace: true })
      } catch {
        clearAuth()  // session หมดอายุ → ให้ login ใหม่
        if (window.location.pathname !== '/') navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    tryRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Global handler: Invalid or expired access token ───────────
  useEffect(() => {
    const handler = () => {
      const path = window.location.pathname
      if (path.startsWith('/api/docs') || path.startsWith('/system/diagrams')) {
        return
      }
      clearAuth()
      toast.error('Session หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่')
      navigate('/', { replace: true })
    }
    window.addEventListener('insightcode:auth-expired', handler)
    return () => window.removeEventListener('insightcode:auth-expired', handler)
  }, [clearAuth, navigate])

  const handleNavigate = (page: Page) => {
    const map: Record<Page, string> = {
      auth: '/',
      problems: '/problems',
      analytics: '/analyze',
      profile: '/profile',
      // workspace is param-based; only used when already inside a workspace
      workspace: '/problems',
      admin: '/admin',
      adminLogin: '/admin/login',
    }

    setPageLoading(true)
    navigate(map[page])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setPageLoading(false), 500)
  }

  // ─── Loading Screen (รอ silent refresh ก่อนแสดงผล) ───────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111621] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#5586e7] rounded-xl flex items-center justify-center shadow-lg shadow-[#5586e7]/30">
            <span className="material-symbols-outlined text-white text-3xl">terminal</span>
          </div>
          <div className="w-6 h-6 border-2 border-[#5586e7]/30 border-t-[#5586e7] rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading InsightCode...</p>
        </div>
      </div>
    )
  }

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/" replace />
    return <>{children}</>
  }

  const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />
    if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />
    return <>{children}</>
  }

  return (
    <Routes>
      {/* user auth */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/problems" replace />
          ) : (
            <AuthPage onNavigate={handleNavigate} />
          )
        }
      />

      {/* main app */}
      <Route
        path="/problems"
        element={
          <RequireAuth>
            <ProblemExplorerPage onNavigate={handleNavigate} />
          </RequireAuth>
        }
      />
      <Route
        path="/analyze"
        element={
          <RequireAuth>
            <AiAnalyticsPage onNavigate={handleNavigate} />
          </RequireAuth>
        }
      />
      <Route
        path="/workspace/:id"
        element={
          <RequireAuth>
            <ProblemWorkspacePage onNavigate={handleNavigate} />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <UserProfilePage onNavigate={handleNavigate} />
          </RequireAuth>
        }
      />

      {/* admin */}
      <Route path="/admin/login" element={<AdminLoginPage onNavigate={handleNavigate} />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage onNavigate={handleNavigate} />
          </RequireAdmin>
        }
      />

      {/* API docs (no auth guard for now) */}
      <Route path="/api/docs" element={<ApiDocsPage />} />

      {/* System diagrams (public, read-only) */}
      <Route path="/system/diagrams" element={<SystemDiagramsPage />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
