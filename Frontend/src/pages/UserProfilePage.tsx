import { useState, type FormEvent } from 'react'
import type { Page } from '../types'
import PageLayout from '../components/layout/PageLayout'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/authApi'
import toast from 'react-hot-toast'

interface UserProfilePageProps {
  onNavigate: (page: Page) => void
}

export default function UserProfilePage({ onNavigate }: UserProfilePageProps) {
  const { user, accessToken, updateUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isSaving, setIsSaving] = useState(false)

  if (!user || !accessToken) {
    onNavigate('auth')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const promise = authApi
      .updateProfile({ fullName, avatarUrl }, accessToken)
      .then((res) => {
        updateUser(res.user)
        return res
      })

    toast.promise(promise, {
      loading: 'Saving profile...',
      success: 'Profile updated successfully',
      error: (err) => err?.message || 'Failed to update profile',
    })
      .finally(() => setIsSaving(false))
  }

  return (
    <PageLayout currentPage="profile" onNavigate={onNavigate}>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight dark:text-white">
              Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your account information and personal details.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#5586e7]/20 border-2 border-[#5586e7]/40 flex items-center justify-center text-2xl font-bold text-[#5586e7] overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName || user.email} className="h-full w-full object-cover" />
                ) : (
                  <span>{(user.fullName ?? user.email ?? 'U')[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">
                  Role: {user.role}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#5586e7] focus:border-transparent dark:text-white"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#5586e7] focus:border-transparent dark:text-white"
                  placeholder="https://..."
                />
                <p className="text-[11px] text-slate-500">
                  Paste a public image URL (e.g. from your CDN, GitHub avatar, or Notion).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFullName(user.fullName ?? '')
                  setAvatarUrl(user.avatarUrl ?? '')
                  toast('Reverted changes', { icon: '↩️' })
                }}
                className="px-4 py-2 text-xs md:text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs md:text-sm font-bold rounded-lg bg-[#5586e7] text-white hover:bg-[#4474d6] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </PageLayout>
  )
}

