import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import { LoadingProvider } from './contexts/LoadingContext'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'react-hot-toast'
import type { Page } from './types'

type AdminRoute = 'login' | 'console'

function AdminApp() {
  const [route, setRoute] = useState<AdminRoute>('login')
  const { isAuthenticated, user } = useAuthStore()

  const handleNavigate = (page: Page) => {
    if (page === 'admin') setRoute('console')
    if (page === 'adminLogin') setRoute('login')
  }

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return <AdminLoginPage onNavigate={handleNavigate} />
  }

  if (route === 'login') {
    return <AdminLoginPage onNavigate={handleNavigate} />
  }

  return <AdminPage onNavigate={handleNavigate} />
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

