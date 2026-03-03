import type { ReactNode } from "react"
import { useLoading } from "../../contexts/LoadingContext"
import { Link } from "react-router-dom"

interface AdminPageLayoutProps {
  children: ReactNode
  fullScreen?: boolean
}

interface AdminSkeletonProps {
    fullScreen: boolean
}

function AdminSkeleton({ fullScreen }: AdminSkeletonProps) {
    return (
        <div
        className={`
            p-8
            ${fullScreen ? 'min-h-screen overflow-hidden' : ''}
        `}
        >
        <div className="space-y-6">

            {/* Page Title */}
            <div>
            <div className="skeleton h-8 w-1/4 mb-3" />
            <div className="skeleton h-4 w-1/3" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            </div>

            {/* Table area */}
            <div className="skeleton h-96 w-full rounded-2xl" />
        </div>
        </div>
    )
}

export default function AdminPageLayout({
  children,
  fullScreen = false,
}: AdminPageLayoutProps) {
  const { loading } = useLoading()

  return (
    <div className="drawer lg:drawer-open bg-base-200">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      {/* Content */}
      <div className="drawer-content flex flex-col min-h-screen">

        {/* Top Bar */}
        <div className="navbar bg-base-100 shadow-md px-6">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="admin-drawer"
              className="btn btn-square btn-ghost"
            >
              ☰
            </label>
          </div>
          <div className="flex-1">
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Main Area */}
        <div className={`flex-1 ${fullScreen ? 'overflow-hidden' : ''}`}>
          {loading ? (
            <AdminSkeleton fullScreen={fullScreen} />
          ) : (
            <div className="fade-in-soft p-8">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="admin-drawer" className="drawer-overlay" />

        <aside className="w-64 bg-base-100 p-6 space-y-2">

          <div className="text-xl font-bold mb-6">
            CodeJudge
          </div>

          <Link to="/admin/dashboard" className="btn btn-ghost w-full justify-start">
            Dashboard
          </Link>

          <Link to="/admin/problems" className="btn btn-ghost w-full justify-start">
            Problems
          </Link>

          <Link to="/admin/users" className="btn btn-ghost w-full justify-start">
            Users
          </Link>

          <Link to="/admin/submissions" className="btn btn-ghost w-full justify-start">
            Submissions
          </Link>

          <Link to="/admin/system" className="btn btn-ghost w-full justify-start">
            System
          </Link>

        </aside>
      </div>
    </div>
  )
}