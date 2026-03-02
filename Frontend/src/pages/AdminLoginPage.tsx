import { useState, type FormEvent } from 'react'
import type { Page } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../contexts/LoadingContext'

interface AdminLoginPageProps {
  onNavigate: (page: Page) => void
}

export default function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { adminLogin } = useAuth()
  const { setLoading } = useLoading()
  // const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await adminLogin({ email, password, adminCode })
      setLoading(true)
      setTimeout(() => setLoading(false), 600)
      onNavigate('admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#0f172a] min-h-screen flex items-center justify-center px-4 font-[Space_Grotesk] text-white">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#5586e7] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">InsightCode Admin</h1>
            <p className="text-xs text-slate-400">Restricted console for platform administrators</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/40 border border-red-700 rounded-lg">
            <span className="material-symbols-outlined text-red-400 text-lg">error</span>
            <p className="text-xs text-red-100">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7] focus:border-transparent"
                placeholder="admin@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              Admin Code
              <span className="text-[10px] text-slate-500 font-normal">(from environment)</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                key
              </span>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm outline-none focus:ring-2 focus:ring-[#5586e7] focus:border-transparent"
                placeholder="Enter admin code"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full h-11 rounded-lg bg-[#5586e7] hover:bg-[#4474d6] text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">login</span>
                Sign in as Admin
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

