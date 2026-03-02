import { useState, useEffect } from 'react'
import type { Page } from './types'
import { useAuthStore } from './store/authStore'
import { authApi } from './services/authApi'
import AuthPage from './pages/AuthPage'
import ProblemExplorerPage from './pages/ProblemExplorerPage'
import CodingWorkspacePage from './pages/CodingWorkspacePage'
import AiAnalyticsPage from './pages/AiAnalyticsPage'
import { useLoading } from './contexts/LoadingContext'
import UserProfilePage from './pages/UserProfilePage'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth')
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore()
  const { setLoading: setPageLoading } = useLoading()

  // ─── Silent Refresh on App Boot ───────────────────────────────
  // เมื่อ user reload → accessToken หายจาก memory
  // แต่ refreshToken ยังอยู่ใน HttpOnly Cookie → ขอใหม่โดยอัตโนมัติ
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { accessToken } = await authApi.refresh()
        const { user } = await authApi.getMe(accessToken)
        setAuth(user, accessToken)
        setCurrentPage('problems')  // เปลี่ยนหน้าทันทีถ้า session ยังคงอยู่
      } catch {
        clearAuth()  // session หมดอายุ → ให้ login ใหม่
      } finally {
        setLoading(false)
      }
    }

    tryRefresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (page: Page) => {
    setPageLoading(true)
    setCurrentPage(page)
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

  // ─── Route Guard: redirect ถ้าไม่ได้ login ─────────────────────
  if (!isAuthenticated && currentPage !== 'auth') {
    return <AuthPage onNavigate={handleNavigate} />
  }

  return (
    <>
      {currentPage === 'auth' && (
        <AuthPage onNavigate={handleNavigate} />
      )}
      {currentPage === 'profile' && (
        <UserProfilePage onNavigate={handleNavigate} />
      )}
      {currentPage === 'problems' && (
        <ProblemExplorerPage onNavigate={handleNavigate} />
      )}
      {currentPage === 'workspace' && (
        <CodingWorkspacePage onNavigate={handleNavigate} />
      )}
      {currentPage === 'analytics' && (
        <AiAnalyticsPage onNavigate={handleNavigate} />
      )}
    </>
  )
}
