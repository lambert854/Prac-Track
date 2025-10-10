'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useToast as useToastHook } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/ui/toast'

interface ToastContextType {
  toast: (toastData: {
    title: string
    description: string
    type: 'success' | 'error' | 'info' | 'warning'
    duration?: number
  }) => void
  removeToast: (id: string) => void
  toasts: Array<{
    id: string
    title: string
    description: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, removeToast, toasts } = useToastHook()

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
