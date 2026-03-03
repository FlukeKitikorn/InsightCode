import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './index.css'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import ProblemListPage from './pages/admin/ProblemListPage'
import ProblemDetailPage from './pages/admin/ProblemDetailPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage'
import AdminAiInsightsPage from './pages/admin/AdminAiInsightsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import { LoadingProvider } from './contexts/LoadingContext'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'react-hot-toast'
import type { Page } from './types'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

function AdminLoginRoute() {
  const navigate = useNavigate()

  const handleNavigate = (page: Page) => {
    if (page === 'admin') navigate('/admin', { replace: true })
    if (page === 'adminLogin') navigate('/admin/login', { replace: true })
  }

  return <AdminLoginPage onNavigate={handleNavigate} />
}

function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginRoute />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="problems" element={<ProblemListPage />} />
          <Route path="problems/:id" element={<ProblemDetailPage />} />
          <Route path="submissions" element={<AdminSubmissionsPage />} />
          <Route path="ai" element={<AdminAiInsightsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <LoadingProvider>
      <>
        <AdminApp />
        <Toaster position="top-right" />
      </>
    </LoadingProvider>
  </StrictMode>,
)

