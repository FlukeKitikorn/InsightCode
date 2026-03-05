import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { label: 'Users', icon: 'group', path: '/admin/users' },
  { label: 'Problems', icon: 'code_blocks', path: '/admin/problems' },
  { label: 'Submissions', icon: 'history', path: '/admin/submissions' },
  { label: 'AI Insights', icon: 'analytics', path: '/admin/ai' },
  { label: 'Settings', icon: 'settings', path: '/admin/settings' },
]

export default function AdminLayout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-[#020617]/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[#5586e7] hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            <span className="font-bold text-sm md:text-base tracking-tight">InsightCode Admin</span>
          </button>
          <span className="hidden md:inline text-xs text-slate-500">
            | Monitor users, problems & AI insights
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">
                {user?.fullName ?? user?.email ?? 'Admin'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {user?.role ?? 'ADMIN'}
              </p>
            </div>
            <div className="avatar placeholder">
              <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-xs font-bold">
                <span>{(user?.email ?? 'A').charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/admin/login', { replace: true })
            }}
            className="btn btn-xs md:btn-sm btn-outline border-slate-600 text-slate-100 hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-sm mr-1">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Layout body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex w-64 bg-[#020617] border-r border-slate-800 flex-col shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-[#5586e7] text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500">
            InsightCode • Admin Console
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#020617]/95 border-t border-slate-800 flex justify-around py-1">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-1 ${
                isActive(item.path) ? 'text-[#5586e7]' : 'text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-10 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

