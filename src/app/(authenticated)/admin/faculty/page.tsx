import { requireAdmin } from '@/lib/auth-helpers'
import { AdminFacultyManagement } from '@/components/admin/admin-faculty-management'

export default async function AdminFacultyPage() {
  await requireAdmin()

  return <AdminFacultyManagement />
}
