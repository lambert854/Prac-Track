'use client'

import { QueryProvider } from './query-provider'
import { AuthProvider } from './auth-provider'
import { ToastProvider } from '@/providers/toast-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
