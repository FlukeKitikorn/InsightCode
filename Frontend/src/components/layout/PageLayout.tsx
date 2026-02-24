import type { ReactNode } from 'react'
import type { Page } from '../../types'
import Navbar from './Navbar'
import Footer from './Footer'

interface PageLayoutProps {
    children: ReactNode
    currentPage: Page
    onNavigate: (page: Page) => void
    /**
     * fullScreen — for pages that need h-screen + overflow-hidden layout
     * (e.g. Workspace, Analytics w/ sidebar, Admin w/ sidebar)
     * In this mode the main area is flex-col and no global footer is rendered.
     */
    fullScreen?: boolean
}

export default function PageLayout({
    children,
    currentPage,
    onNavigate,
    fullScreen = false,
}: PageLayoutProps) {
    return (
        <div
            className={`flex flex-col bg-[#f6f6f8] dark:bg-[#111621] text-slate-800 dark:text-slate-200
        ${fullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
        >
            {/* ── Shared Navbar ─────────────────────────────────────── */}
            <Navbar currentPage={currentPage} onNavigate={onNavigate} />

            {/* ── Page Content ──────────────────────────────────────── */}
            <div className={`flex-1 flex flex-col ${fullScreen ? 'overflow-hidden' : ''}`}>
                {children}
            </div>

            {/* ── Shared Footer (scrollable pages only) ─────────────── */}
            {!fullScreen && <Footer />}
        </div>
    )
}
