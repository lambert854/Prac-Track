'use client'

import { useSession } from 'next-auth/react'
import { SupervisorTimesheets } from '@/components/supervisor/supervisor-timesheets'

export default function SupervisorTimesheetsPage() {
  const { data: session } = useSession()

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  return <SupervisorTimesheets supervisorId={session.user.id} />
}
