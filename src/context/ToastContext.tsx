import { createContext, ReactNode, useContext, useState } from 'react'

type Toast = { id: number; message: string; type: 'success' | 'error' }
const ToastContext = createContext<{ show: (message: string, type: Toast['type']) => void } | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = (message: string, type: Toast['type']) => { const id = Date.now(); setToasts((current) => [...current, { id, message, type }]); window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500) }
  return <ToastContext.Provider value={{ show }}>{children}<div className="toast-region" aria-live="polite">{toasts.map((toast) => <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>)}</div></ToastContext.Provider>
}
export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error('useToast must be used within ToastProvider'); return context }
