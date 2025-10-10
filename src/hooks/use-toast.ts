'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toastData, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration (default 5 seconds)
    const duration = toastData.duration || 5000
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    removeToast,
    toasts,
  }
}
