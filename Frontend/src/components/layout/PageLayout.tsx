import type { ReactNode } from 'react'
import type { Page } from '../../types'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatBubble from '../chat/ChatBubble'
import { useLoading } from '../../contexts/LoadingContext'

interface PageLayoutProps {
    children: ReactNode
    currentPage: Page
    onNavigate: (page: Page) => void
    fullScreen?: boolean
    loading?: boolean  
}

interface SkeletonProps {
    fullScreen: boolean
}

function GlobalSkeleton({ fullScreen }: SkeletonProps) {
  return (
    <div
      className={`
        flex items-start justify-center px-6 py-10 
        ${fullScreen ? 'min-h-screen overflow-hidden' : ''}
      `}
    >
      <div className="
        w-full max-w-6xl
        bg-base-200
        border border-base-300
        rounded-2xl
        shadow-xl
        p-8
        space-y-8
      ">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40 mb-4">
            Loading workspace
          </p>
          <div className="skeleton h-8 w-1/3 mb-3" />
          <div className="skeleton h-4 w-1/2" />
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Problem Section */}
          <div className="space-y-4">
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
            <div className="skeleton h-40 w-full rounded-xl" />
          </div>

          {/* Right: Code Editor Section */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="skeleton h-8 w-28 rounded-md" />
              <div className="skeleton h-8 w-24 rounded-md" />
            </div>
            <div className="skeleton h-80 w-full rounded-2xl" />
            <div className="flex gap-4 pt-2">
              <div className="skeleton h-10 w-24 rounded-lg" />
              <div className="skeleton h-10 w-24 rounded-lg" />
            </div>
          </div>

        </div>

        {/* Bottom Result Panel */}
        <div className="space-y-3 pt-4 border-t border-base-300">
          <div className="skeleton h-5 w-1/4" />
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>

      </div>
    </div>
  )
}

export default function PageLayout({
    children,
    currentPage,
    onNavigate,
    fullScreen = false,
}: PageLayoutProps) {
    const {loading} = useLoading()
    return (
        <div
            className={`flex flex-col bg-[#f6f6f8] dark:bg-[#111621] text-slate-800 dark:text-slate-200
        ${fullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
        >
            {/* Navbar */}
            <Navbar currentPage={currentPage} onNavigate={onNavigate} />

            {/* Page Content — fullScreen ต้องมี min-h-0 เพื่อให้ workspace รับความสูงจาก viewport ได้ */}
            <div className={`flex-1 flex flex-col min-h-0 ${fullScreen ? 'overflow-hidden' : ''}`}>
                {loading ? (
                  <GlobalSkeleton fullScreen={fullScreen} />
                ) : (
                  <div className="fade-in-soft flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                  </div>
                )}
            </div>

            {!fullScreen && <Footer />}

            {/* AI Chat bubble — เปิด/ปิดด้วย DaisyUI toggle */}
            <ChatBubble />
        </div>
    )
}