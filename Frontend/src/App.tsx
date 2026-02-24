import { useState } from 'react'
import type { Page } from './types'
import AuthPage from './pages/AuthPage'
import ProblemExplorerPage from './pages/ProblemExplorerPage'
import CodingWorkspacePage from './pages/CodingWorkspacePage'
import AiAnalyticsPage from './pages/AiAnalyticsPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth')

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {currentPage === 'auth' && (
        <AuthPage onNavigate={handleNavigate} />
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
      {currentPage === 'admin' && (
        <AdminPage onNavigate={handleNavigate} />
      )}
    </>
  )
}
