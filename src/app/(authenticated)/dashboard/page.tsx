import { requireAuth } from '@/lib/auth-helpers'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const session = await requireAuth()

  return <DashboardContent user={session.user} />
}
