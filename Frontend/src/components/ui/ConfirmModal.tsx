import { type ReactNode } from 'react'

export interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'error' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const btnClass =
    variant === 'error'
      ? 'btn btn-error'
      : variant === 'warning'
        ? 'btn btn-warning'
        : 'btn btn-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">{message}</div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="btn btn-ghost" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={btnClass}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
