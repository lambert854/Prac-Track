import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { AdminStudentsManagement } from '@/components/admin/admin-students-management'

export default async function AdminStudentsPage() {
  await requireFacultyOrAdmin()

  return <AdminStudentsManagement />
}
