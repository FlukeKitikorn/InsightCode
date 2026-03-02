import type { ReactNode } from 'react'

interface NotificationModalProps {
  open: boolean
  onClose: () => void
  children?: ReactNode
}

export default function NotificationModal({ open, onClose, children }: NotificationModalProps) {
  if (!open) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5586e7] text-xl">notifications_active</span>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Notifications
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-3 space-y-2 text-sm">
          {children}
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}

