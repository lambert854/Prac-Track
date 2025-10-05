import { requireFacultyOrAdmin } from '@/lib/auth-helpers'
import { FacultyAssignmentsManagement } from '@/components/admin/faculty-assignments-management'

export default async function FacultyAssignmentsPage() {
  await requireFacultyOrAdmin()

  return <FacultyAssignmentsManagement />
}
