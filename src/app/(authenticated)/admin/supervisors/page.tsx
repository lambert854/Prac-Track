import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { AdminSupervisorsManagement } from '@/components/admin/admin-supervisors-management'

export default async function AdminSupervisorsPage() {
  await requireFacultyOrAdmin()

  return <AdminSupervisorsManagement />
}
