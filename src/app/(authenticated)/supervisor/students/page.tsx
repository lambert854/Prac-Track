'use client'

import { useSession } from 'next-auth/react'
import { SupervisorStudents } from '@/components/supervisor/supervisor-students'

export default function SupervisorStudentsPage() {
  const { data: session } = useSession()

  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  return <SupervisorStudents supervisorId={session.user.id} />
}
