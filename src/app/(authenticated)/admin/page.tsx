import { requireAdmin } from '@/lib/auth-helpers'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

export default async function AdminPage() {
  const session = await requireAdmin()

  return <AdminDashboard user={session.user} />
}
