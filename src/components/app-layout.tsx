'use client'

import { useSession } from 'next-auth/react'
import { Navigation } from './navigation'
import { LoadingSpinner } from './ui/loading-spinner'
import { SupportButton } from './support-button'
import { FloatingHelpButton } from './floating-help-button'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <SupportButton />
      <FloatingHelpButton />
    </div>
  )
}
