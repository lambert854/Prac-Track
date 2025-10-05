import { requireSupervisor } from '@/lib/auth-helpers'
import { SupervisorDashboard } from '@/components/dashboard/supervisor-dashboard'

export default async function SupervisorPage() {
  const session = await requireSupervisor()

  return <SupervisorDashboard user={session.user} />
}
