import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { chatApi, type ChatMessage } from '../../services/chatApi'
import toast from 'react-hot-toast'
import { animate } from 'motion'

const PLACEHOLDER = 'ถามแนวคิด อธิบาย concept หรือ syntax ได้ (บอทจะไม่เฉลยโจทย์)'

function getInitials(fullName: string | null | undefined, email?: string) {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(' ')
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    const initials = (first + last).toUpperCase()
    if (initials) return initials
  }
  if (email && email.length > 0) return email[0].toUpperCase()
  return 'U'
}

export default function ChatBubble() {
  const { user, accessToken } = useAuthStore()
  const params = useParams<{ id: string }>()
  const problemId = params.id ?? null
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ใช้ motion animate ตอนเปิด panel
  useEffect(() => {
    if (open && panelRef.current) {
      const el = panelRef.current
      // reset initial state ก่อน animate
      el.style.opacity = '0'
      el.style.transform = 'translateY(16px) scale(0.95)'

      void animate(
        el,
        {
          opacity: [0, 1],
          transform: ['translateY(16px) scale(0.95)', 'translateY(0px) scale(1)'],
        } as any,
        { duration: 0.22 } as any
      )
    }
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || !accessToken) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const { reply } = await chatApi.send(accessToken, {
        problemId: problemId ?? undefined,
        message: text,
        history: messages.slice(-10),
      })
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ส่งไม่สำเร็จ')
      setMessages((m) => m.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const userInitials = getInitials(user?.fullName, user?.email)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
      {/* Panel */}
      {open ? (
        <div
          ref={panelRef}
          className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl w-[380px] max-w-[calc(100vw-3rem)] flex flex-col max-h-[520px] overflow-hidden origin-bottom-right"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-[#5586e7]/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5586e7] to-[#7f9bf5] flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-lg">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 dark:text-slate-50 text-sm">
                  AI ช่วยติว
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  แนะนำแนวคิด / concept / syntax เท่านั้น
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost btn-xs btn-circle hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              aria-label="ปิด"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[360px] bg-slate-50/60 dark:bg-slate-900/40">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 px-3">
                {PLACEHOLDER}
              </p>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={i}
                  className={`chat ${isUser ? 'chat-end' : 'chat-start'} animate-[fade-in_0.18s_ease-out]`}
                >
                  <div className="chat-image avatar">
                    <div
                      className={`w-9 h-9 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-slate-950/70 ${
                        isUser ? 'ring-[#5586e7]/70' : 'ring-emerald-400/70'
                      } bg-slate-800 flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {isUser ? (
                        user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName ?? user.email ?? 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{userInitials}</span>
                        )
                      ) : (
                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`chat-bubble text-sm max-w-[75%] break-words whitespace-pre-wrap shadow-sm ${
                      isUser
                        ? 'chat-bubble-primary'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5586e7] to-[#7f9bf5] flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                  </div>
                </div>
                <div className="chat-bubble bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 max-w-[75%]">
                  <span className="loading loading-dots loading-sm" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={PLACEHOLDER}
                className="input input-bordered input-sm flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-xs"
                disabled={loading}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="btn btn-primary btn-sm min-w-[64px] shadow-md shadow-[#5586e7]/30"
              >
                ส่ง
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* FAB toggle */}
      <label className="pointer-events-auto btn btn-circle btn-primary shadow-lg w-14 h-14 cursor-pointer flex items-center justify-center transition-transform duration-150 hover:scale-105">
        <input
          type="checkbox"
          className="sr-only"
          checked={open}
          onChange={(e) => setOpen(e.target.checked)}
        />
        <span className="material-symbols-outlined text-2xl">
          {open ? 'close' : 'chat'}
        </span>
      </label>
    </div>
  )
}
