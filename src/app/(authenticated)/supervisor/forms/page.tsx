'use client'

import { useSession } from 'next-auth/react'
import { SupervisorForms } from '@/components/supervisor/supervisor-forms'

export default function SupervisorFormsPage() {
  const { data: session } = useSession()

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  return <SupervisorForms supervisorId={session.user.id} />
}
