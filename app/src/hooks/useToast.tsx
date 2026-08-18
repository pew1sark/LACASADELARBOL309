import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; tone: Tone }

const Ctx = createContext<{ push: (message: string, tone?: Tone) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lift fade-up ${
              t.tone === 'success'
                ? 'bg-leaf-700 text-white'
                : t.tone === 'error'
                  ? 'bg-terra-500 text-white'
                  : 'bg-bark-900 text-cream-50'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
