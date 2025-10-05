import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { AdminReports } from '@/components/admin/admin-reports'

export default async function AdminReportsPage() {
  await requireFacultyOrAdmin()

  return <AdminReports />
}
